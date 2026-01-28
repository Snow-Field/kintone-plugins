// 未使用変数（no-unused-vars）
const unusedValue = 123;

// var の使用（no-var）
var count = 0;

// == の使用（eqeqeq）
if (count == '0') {
  console.log('equal');
}

// 再代入不可な変数への再代入（no-const-assign）
const value = 10;
value = 20;

// 到達不能コード（no-unreachable）
function unreachable() {
  return;
  console.log('never called');
}

// グローバル汚染（no-undef）
foo = 1;

// trailing space（no-trailing-spaces）
const message = 'hello';
