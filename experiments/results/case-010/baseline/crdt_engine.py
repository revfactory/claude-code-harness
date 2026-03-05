"""
CRDT Real-time Collaborative Text Editor Engine
Based on RGA (Replicated Growable Array) algorithm.

Each character is identified by a unique ID (siteId, lamportClock).
Deletions use tombstone markers to preserve causal ordering.
Concurrent insertions at the same position are resolved deterministically
by comparing character IDs (higher lamport clock wins, then higher siteId).
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Optional
import copy


@dataclass(frozen=True, order=True)
class CharId:
    """Unique identifier for a character: (lamport_clock, site_id).
    Ordering: higher lamport wins; ties broken by higher site_id.
    This gives a total, deterministic order for concurrent inserts."""
    lamport: int
    site_id: int

    def __repr__(self):
        return f"({self.lamport},{self.site_id})"


# Sentinel: virtual head of the linked list
HEAD_ID = CharId(0, 0)


@dataclass
class CharNode:
    """A node in the RGA linked list."""
    id: CharId
    char: str
    deleted: bool = False
    # Pointer to the id of the node after which this was inserted
    parent_id: Optional[CharId] = None

    def __repr__(self):
        mark = "†" if self.deleted else ""
        return f"[{self.id}:'{self.char}'{mark}]"


@dataclass
class Operation:
    """Represents an insert or delete operation that can be sent remotely."""
    op_type: str  # 'insert' or 'delete'
    char_id: CharId  # ID of the character being inserted/deleted
    char: str = ""  # The character (only for insert)
    parent_id: Optional[CharId] = None  # After which node (only for insert)

    def __repr__(self):
        if self.op_type == "insert":
            return f"Ins('{self.char}',id={self.char_id},after={self.parent_id})"
        return f"Del(id={self.char_id})"


class CRDTDocument:
    """
    A CRDT document using the RGA algorithm.
    Internally maintains a doubly-linked list of CharNodes.
    The list is stored as a simple Python list for clarity,
    with a virtual HEAD sentinel at index 0.
    """

    def __init__(self, site_id: int):
        self.site_id = site_id
        self.lamport_clock = 0
        # The sequence: index 0 is the virtual HEAD
        self.nodes: list[CharNode] = [CharNode(id=HEAD_ID, char="\0", parent_id=None)]
        self._applied_ops: set[tuple] = set()  # For idempotency

    def _op_key(self, op: Operation) -> tuple:
        return (op.op_type, op.char_id.lamport, op.char_id.site_id)

    def _next_id(self) -> CharId:
        self.lamport_clock += 1
        return CharId(self.lamport_clock, self.site_id)

    def _update_clock(self, remote_lamport: int):
        self.lamport_clock = max(self.lamport_clock, remote_lamport)

    def _visible_nodes(self) -> list[CharNode]:
        """Return non-deleted nodes (excluding HEAD)."""
        return [n for n in self.nodes[1:] if not n.deleted]

    def _visible_index_to_node_index(self, visible_pos: int) -> int:
        """Convert a visible text position to the internal node list index.
        visible_pos 0 maps to the first visible character's internal index.
        If visible_pos equals the number of visible chars, returns the index
        of the last visible char (for appending after it).
        """
        count = -1
        for i, node in enumerate(self.nodes):
            if i == 0:
                if visible_pos == 0:
                    return 0  # Insert after HEAD
                continue
            if not node.deleted:
                count += 1
                if count == visible_pos - 1:
                    return i
                if count == visible_pos:
                    return i
        # If pos is at the end
        return len(self.nodes) - 1

    def _find_node_index(self, char_id: CharId) -> int:
        """Find the index of a node by its CharId."""
        for i, node in enumerate(self.nodes):
            if node.id == char_id:
                return i
        return -1

    def _find_parent_index_for_visible_pos(self, pos: int) -> int:
        """Find the internal index of the node AFTER which we should insert
        for a given visible text position.
        pos=0 means insert at the very beginning (after HEAD).
        pos=k means insert after the k-th visible character.
        """
        if pos == 0:
            return 0  # After HEAD
        count = 0
        for i in range(1, len(self.nodes)):
            if not self.nodes[i].deleted:
                count += 1
                if count == pos:
                    return i
        return len(self.nodes) - 1

    def _find_visible_node_at(self, pos: int) -> int:
        """Find internal index of the pos-th visible character (0-based)."""
        count = 0
        for i in range(1, len(self.nodes)):
            if not self.nodes[i].deleted:
                if count == pos:
                    return i
                count += 1
        raise IndexError(f"No visible char at position {pos}")

    def localInsert(self, pos: int, char: str) -> Operation:
        """Insert character `char` at visible position `pos`.
        Returns the Operation to broadcast."""
        parent_idx = self._find_parent_index_for_visible_pos(pos)
        parent_id = self.nodes[parent_idx].id
        new_id = self._next_id()
        new_node = CharNode(id=new_id, char=char, parent_id=parent_id)

        # Find the correct insertion point in the internal list
        insert_idx = self._find_insert_position(parent_idx, new_id)
        self.nodes.insert(insert_idx, new_node)

        op = Operation(op_type="insert", char_id=new_id, char=char, parent_id=parent_id)
        self._applied_ops.add(self._op_key(op))
        return op

    def localDelete(self, pos: int) -> Operation:
        """Delete the character at visible position `pos`.
        Returns the Operation to broadcast."""
        idx = self._find_visible_node_at(pos)
        self.nodes[idx].deleted = True
        op = Operation(op_type="delete", char_id=self.nodes[idx].id)
        self._applied_ops.add(self._op_key(op))
        return op

    def _find_insert_position(self, parent_idx: int, new_id: CharId) -> int:
        """RGA insertion: find where to place a new node after parent_idx.

        We scan right from parent_idx+1. We skip over nodes whose parent
        is the same as ours AND whose ID is greater than ours (they win
        the tie). We stop when we find a node with a smaller ID (same parent)
        or a node whose parent is not our parent (it belongs to a different
        sub-sequence).
        """
        parent_node_id = self.nodes[parent_idx].id
        i = parent_idx + 1
        while i < len(self.nodes):
            node = self.nodes[i]
            # If this node was also inserted after the same parent
            if node.parent_id == parent_node_id:
                # RGA: higher ID goes first (closer to parent)
                if node.id > new_id:
                    i += 1
                    continue
                else:
                    break
            else:
                # Check if this node is a descendant (inserted after a node
                # that comes after parent). We need to skip over entire
                # subtrees of nodes that were inserted after siblings with
                # higher IDs.
                # If the node's parent is one of the nodes between parent_idx+1
                # and i, it's a descendant of a sibling — skip it.
                if self._is_descendant_of_range(node, parent_idx + 1, i):
                    i += 1
                    continue
                break
            i += 1
        return i

    def _is_descendant_of_range(self, node: CharNode, start: int, end: int) -> bool:
        """Check if node's parent_id matches any node in self.nodes[start:end]."""
        for j in range(start, end):
            if self.nodes[j].id == node.parent_id:
                return True
        return False

    def applyRemote(self, op: Operation) -> bool:
        """Apply a remote operation. Returns True if applied, False if duplicate."""
        key = self._op_key(op)
        if key in self._applied_ops:
            return False  # Idempotent: already applied

        self._update_clock(op.char_id.lamport)

        if op.op_type == "insert":
            # Find the parent node
            parent_idx = self._find_node_index(op.parent_id)
            if parent_idx == -1:
                raise ValueError(f"Parent node {op.parent_id} not found")
            new_node = CharNode(id=op.char_id, char=op.char, parent_id=op.parent_id)
            insert_idx = self._find_insert_position(parent_idx, op.char_id)
            self.nodes.insert(insert_idx, new_node)

        elif op.op_type == "delete":
            idx = self._find_node_index(op.char_id)
            if idx == -1:
                raise ValueError(f"Node {op.char_id} not found for delete")
            self.nodes[idx].deleted = True

        self._applied_ops.add(key)
        return True

    def getText(self) -> str:
        """Return the visible text."""
        return "".join(n.char for n in self.nodes[1:] if not n.deleted)

    def __repr__(self):
        return f"Doc(site={self.site_id}, text='{self.getText()}')"


class Site:
    """Represents a collaboration site (user/peer) with its own document
    and a pending operations buffer."""

    def __init__(self, site_id: int):
        self.site_id = site_id
        self.doc = CRDTDocument(site_id)
        self._pending_ops: list[Operation] = []

    def insert(self, pos: int, char: str) -> Operation:
        op = self.doc.localInsert(pos, char)
        self._pending_ops.append(op)
        return op

    def delete(self, pos: int) -> Operation:
        op = self.doc.localDelete(pos)
        self._pending_ops.append(op)
        return op

    def getPendingOps(self) -> list[Operation]:
        return list(self._pending_ops)

    def sync(self, other_site: "Site"):
        """Exchange pending ops with another site (bidirectional)."""
        my_ops = self._pending_ops[:]
        their_ops = other_site._pending_ops[:]

        for op in their_ops:
            self.doc.applyRemote(op)
        for op in my_ops:
            other_site.doc.applyRemote(op)

    def getText(self) -> str:
        return self.doc.getText()

    def __repr__(self):
        return f"Site({self.site_id}, text='{self.getText()}')"


class CollaborationSimulator:
    """Simulates multi-site collaboration for testing."""

    def __init__(self):
        self.sites: dict[int, Site] = {}

    def addSite(self, site_id: int) -> Site:
        site = Site(site_id)
        self.sites[site_id] = site
        return site

    def editAt(self, site_id: int, op_type: str, pos: int, char: str = "") -> Operation:
        site = self.sites[site_id]
        if op_type == "insert":
            return site.insert(pos, char)
        elif op_type == "delete":
            return site.delete(pos)
        else:
            raise ValueError(f"Unknown op_type: {op_type}")

    def syncAll(self):
        """Synchronize all sites with each other (all-to-all)."""
        site_list = list(self.sites.values())
        # Collect all pending ops from all sites
        all_ops: list[Operation] = []
        for site in site_list:
            all_ops.extend(site.getPendingOps())

        # Apply all ops to all sites
        for site in site_list:
            for op in all_ops:
                site.doc.applyRemote(op)

        # Clear pending ops
        for site in site_list:
            site._pending_ops.clear()

    def verifyConvergence(self) -> tuple[bool, str]:
        """Check that all sites have the same text. Returns (converged, text)."""
        texts = {sid: site.getText() for sid, site in self.sites.items()}
        values = list(texts.values())
        converged = all(v == values[0] for v in values)
        if not converged:
            detail = ", ".join(f"site{k}='{v}'" for k, v in texts.items())
            return False, f"Divergence: {detail}"
        return True, values[0]
