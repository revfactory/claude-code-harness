"""
Tests for the CRDT collaborative text editor engine.
Covers: basic ops, 2-site sync, conflict scenarios A/B/C,
convergence, and idempotency.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from crdt_engine import (
    CRDTDocument, Site, CollaborationSimulator, CharId, Operation
)


def test_basic_insert():
    """Basic local insert operations."""
    doc = CRDTDocument(site_id=1)
    doc.localInsert(0, 'H')
    doc.localInsert(1, 'i')
    assert doc.getText() == "Hi", f"Expected 'Hi', got '{doc.getText()}'"
    print("  PASS: basic insert")


def test_basic_delete():
    """Basic local delete operations."""
    doc = CRDTDocument(site_id=1)
    doc.localInsert(0, 'A')
    doc.localInsert(1, 'B')
    doc.localInsert(2, 'C')
    assert doc.getText() == "ABC"
    doc.localDelete(1)  # Delete 'B'
    assert doc.getText() == "AC", f"Expected 'AC', got '{doc.getText()}'"
    print("  PASS: basic delete")


def test_insert_at_beginning():
    """Insert at position 0."""
    doc = CRDTDocument(site_id=1)
    doc.localInsert(0, 'B')
    doc.localInsert(0, 'A')
    assert doc.getText() == "AB", f"Expected 'AB', got '{doc.getText()}'"
    print("  PASS: insert at beginning")


def test_insert_in_middle():
    """Insert in the middle of text."""
    doc = CRDTDocument(site_id=1)
    doc.localInsert(0, 'A')
    doc.localInsert(1, 'C')
    doc.localInsert(1, 'B')  # Insert 'B' between A and C
    assert doc.getText() == "ABC", f"Expected 'ABC', got '{doc.getText()}'"
    print("  PASS: insert in middle")


def test_two_site_sync():
    """Two sites sync after independent edits."""
    sim = CollaborationSimulator()
    s1 = sim.addSite(1)
    s2 = sim.addSite(2)

    # Both start empty, make independent edits
    sim.editAt(1, "insert", 0, "A")
    sim.editAt(2, "insert", 0, "B")

    sim.syncAll()

    converged, text = sim.verifyConvergence()
    assert converged, f"Sites diverged after sync: {text}"
    assert len(text) == 2, f"Expected 2 chars, got '{text}'"
    # Both A and B should be present
    assert "A" in text and "B" in text, f"Missing chars in '{text}'"
    print(f"  PASS: two-site sync -> '{text}'")


def test_conflict_a_concurrent_insert_same_position():
    """Conflict A: Two sites insert at the same position concurrently.
    Result must be deterministic regardless of sync order."""
    sim = CollaborationSimulator()
    s1 = sim.addSite(1)
    s2 = sim.addSite(2)

    # Both insert at position 0
    sim.editAt(1, "insert", 0, "X")
    sim.editAt(2, "insert", 0, "Y")

    sim.syncAll()

    converged, text = sim.verifyConvergence()
    assert converged, f"Conflict A diverged: {text}"
    assert len(text) == 2
    assert set(text) == {"X", "Y"}
    print(f"  PASS: conflict A (concurrent insert) -> '{text}'")

    # Verify determinism: do the same thing again with fresh sites
    sim2 = CollaborationSimulator()
    s1b = sim2.addSite(1)
    s2b = sim2.addSite(2)
    sim2.editAt(1, "insert", 0, "X")
    sim2.editAt(2, "insert", 0, "Y")
    sim2.syncAll()
    _, text2 = sim2.verifyConvergence()
    assert text == text2, f"Non-deterministic: '{text}' vs '{text2}'"
    print(f"  PASS: conflict A deterministic")


def test_conflict_b_insert_vs_delete():
    """Conflict B: One site inserts at a position while another deletes there."""
    sim = CollaborationSimulator()
    s1 = sim.addSite(1)
    s2 = sim.addSite(2)

    # Setup: both sites have "ABC"
    sim.editAt(1, "insert", 0, "A")
    sim.editAt(1, "insert", 1, "B")
    sim.editAt(1, "insert", 2, "C")
    sim.syncAll()

    # Now: site1 inserts 'X' after 'B' (pos 2), site2 deletes 'B' (pos 1)
    sim.editAt(1, "insert", 2, "X")
    sim.editAt(2, "delete", 1)  # delete 'B'

    sim.syncAll()

    converged, text = sim.verifyConvergence()
    assert converged, f"Conflict B diverged: {text}"
    # 'B' should be deleted, 'X' should still be present
    assert "B" not in text, f"'B' should be deleted, got '{text}'"
    assert "X" in text, f"'X' should be present, got '{text}'"
    assert "A" in text and "C" in text
    print(f"  PASS: conflict B (insert vs delete) -> '{text}'")


def test_conflict_c_three_site_complex():
    """Conflict C: Three sites with complex concurrent edits must converge."""
    sim = CollaborationSimulator()
    s1 = sim.addSite(1)
    s2 = sim.addSite(2)
    s3 = sim.addSite(3)

    # Setup: all sites have "HELLO"
    for ch in "HELLO":
        sim.editAt(1, "insert", len(s1.getText()), ch)
    sim.syncAll()

    assert s1.getText() == "HELLO"
    assert s2.getText() == "HELLO"
    assert s3.getText() == "HELLO"

    # Concurrent edits:
    # Site 1: insert 'X' at pos 2 (between 'E' and 'L')
    sim.editAt(1, "insert", 2, "X")
    # Site 2: delete pos 2 (first 'L')
    sim.editAt(2, "delete", 2)
    # Site 3: insert 'Y' at pos 2 (between 'E' and 'L')
    sim.editAt(3, "insert", 2, "Y")

    sim.syncAll()

    converged, text = sim.verifyConvergence()
    assert converged, f"Conflict C diverged: {text}"
    # 'L' at original pos 2 should be deleted; X and Y should be present
    assert "X" in text and "Y" in text, f"Missing inserts in '{text}'"
    print(f"  PASS: conflict C (3-site complex) -> '{text}'")


def test_convergence_stress():
    """Multiple rounds of concurrent edits followed by sync."""
    sim = CollaborationSimulator()
    s1 = sim.addSite(1)
    s2 = sim.addSite(2)
    s3 = sim.addSite(3)

    # Round 1
    sim.editAt(1, "insert", 0, "A")
    sim.editAt(2, "insert", 0, "B")
    sim.editAt(3, "insert", 0, "C")
    sim.syncAll()

    converged, text = sim.verifyConvergence()
    assert converged, f"Round 1 diverged: {text}"
    assert len(text) == 3

    # Round 2: more edits on the converged text
    sim.editAt(1, "insert", len(s1.getText()), "1")
    sim.editAt(2, "insert", 0, "2")
    sim.editAt(3, "delete", 0)
    sim.syncAll()

    converged, text = sim.verifyConvergence()
    assert converged, f"Round 2 diverged: {text}"
    print(f"  PASS: convergence stress -> '{text}'")


def test_idempotency():
    """Applying the same operation multiple times should not change the result."""
    doc = CRDTDocument(site_id=1)
    op = doc.localInsert(0, 'Z')

    # Try applying the same op again (as if received remotely)
    result1 = doc.applyRemote(op)
    assert result1 == False, "Should detect duplicate op"
    assert doc.getText() == "Z", f"Text changed after duplicate: '{doc.getText()}'"

    # Also test with a second doc receiving the op twice
    doc2 = CRDTDocument(site_id=2)
    r1 = doc2.applyRemote(op)
    r2 = doc2.applyRemote(op)
    assert r1 == True and r2 == False
    assert doc2.getText() == "Z"
    print("  PASS: idempotency")


def test_idempotency_delete():
    """Deleting the same char twice should be idempotent."""
    s1 = Site(1)
    s2 = Site(2)

    s1.insert(0, "A")
    s1.sync(s2)

    del_op = s1.delete(0)
    # Apply delete to s2
    s2.doc.applyRemote(del_op)
    assert s2.getText() == ""
    # Apply again
    result = s2.doc.applyRemote(del_op)
    assert result == False
    assert s2.getText() == ""
    print("  PASS: idempotency (delete)")


def test_causality_lamport():
    """Lamport clock should increase monotonically and respect causal order."""
    s1 = Site(1)
    s2 = Site(2)

    op1 = s1.insert(0, "A")  # lamport=1
    op2 = s1.insert(1, "B")  # lamport=2
    assert op1.char_id.lamport < op2.char_id.lamport

    # Sync to s2
    s1.sync(s2)
    # s2's clock should now be >= s1's
    op3 = s2.insert(0, "C")
    assert op3.char_id.lamport > op2.char_id.lamport, \
        f"Causality violated: {op3.char_id.lamport} <= {op2.char_id.lamport}"
    print("  PASS: causality (Lamport clock)")


def test_sync_order_independence():
    """Sync order should not affect final result."""
    # Setup 1: sync s1->s2 then s2->s3
    sim1 = CollaborationSimulator()
    a1 = sim1.addSite(1)
    a2 = sim1.addSite(2)
    a3 = sim1.addSite(3)

    a1.insert(0, "A")
    a2.insert(0, "B")
    a3.insert(0, "C")

    # Sync in one order
    a1.sync(a2)
    a2.sync(a3)
    a1.sync(a3)
    # Sync once more to ensure full convergence
    a1.sync(a2)

    text1 = a1.getText()
    text2 = a2.getText()
    text3 = a3.getText()
    assert text1 == text2 == text3, f"Order test failed: {text1}, {text2}, {text3}"

    # Setup 2: sync in a different order
    sim2 = CollaborationSimulator()
    b1 = sim2.addSite(1)
    b2 = sim2.addSite(2)
    b3 = sim2.addSite(3)

    b1.insert(0, "A")
    b2.insert(0, "B")
    b3.insert(0, "C")

    # Different sync order
    b3.sync(b1)
    b2.sync(b3)
    b1.sync(b2)
    b1.sync(b3)

    assert b1.getText() == b2.getText() == b3.getText()
    assert b1.getText() == text1, f"Order-dependent: '{b1.getText()}' vs '{text1}'"
    print(f"  PASS: sync order independence -> '{text1}'")


def run_all_tests():
    tests = [
        ("Basic Insert", test_basic_insert),
        ("Basic Delete", test_basic_delete),
        ("Insert at Beginning", test_insert_at_beginning),
        ("Insert in Middle", test_insert_in_middle),
        ("Two-Site Sync", test_two_site_sync),
        ("Conflict A: Concurrent Inserts", test_conflict_a_concurrent_insert_same_position),
        ("Conflict B: Insert vs Delete", test_conflict_b_insert_vs_delete),
        ("Conflict C: 3-Site Complex", test_conflict_c_three_site_complex),
        ("Convergence Stress", test_convergence_stress),
        ("Idempotency (Insert)", test_idempotency),
        ("Idempotency (Delete)", test_idempotency_delete),
        ("Causality (Lamport)", test_causality_lamport),
        ("Sync Order Independence", test_sync_order_independence),
    ]

    passed = 0
    failed = 0
    errors = []

    for name, fn in tests:
        try:
            print(f"[TEST] {name}")
            fn()
            passed += 1
        except Exception as e:
            failed += 1
            errors.append((name, str(e)))
            print(f"  FAIL: {e}")

    print(f"\n{'='*50}")
    print(f"Results: {passed} passed, {failed} failed out of {len(tests)}")
    if errors:
        print("Failures:")
        for name, err in errors:
            print(f"  - {name}: {err}")
    print(f"{'='*50}")
    return passed, failed, errors


if __name__ == "__main__":
    run_all_tests()
