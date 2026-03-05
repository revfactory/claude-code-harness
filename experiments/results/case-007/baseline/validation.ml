fn map(arr, f) { let result = []; for (let i = 0; i < len(arr); i = i + 1) { push(result, f(arr[i])); } return result; }
fn filter(arr, pred) { let result = []; for (let i = 0; i < len(arr); i = i + 1) { if (pred(arr[i])) { push(result, arr[i]); } } return result; }
let numbers = [1,2,3,4,5,6,7,8,9,10];
let doubled = map(numbers, fn(x) { return x * 2; });
let evens = filter(numbers, fn(x) { return x % 2 == 0; });
print(doubled);
print(evens);
