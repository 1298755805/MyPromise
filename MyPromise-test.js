const MyPromise = require("./MyPromise");

/* 测试MyPromise */
const p = new MyPromise((resolve, reject) => {
  setTimeout(() => {
    resolve("A");
  }, 2000);
});
p.then((res) => {
  console.log(res);
})
  .then((res) => {
    console.log("1");
  })
  .then((res) => {
    console.log("2");
  }); // A 1 2

/* 测试静态方法all */
const p1 = MyPromise.resolve(1);
const p2 = MyPromise.resolve(2);
const p3 = MyPromise.resolve(3);
MyPromise.all([p1, p2, p3]).then((res) => console.log(res)); // [1,2,3]

/* 测试静态方法race */
const p4 = new MyPromise((resolve, reject) => {
  setTimeout(() => {
    resolve("p4");
  }, 1000);
});
const p5 = new MyPromise((resolve, reject) => {
  setTimeout(() => {
    resolve("p5");
  }, 2000);
});
const p6 = new MyPromise((resolve, reject) => {
  setTimeout(() => {
    resolve("p6");
  }, 3000);
});
MyPromise.race([p4, p5, p6]).then((res) => {
  console.log(res);
}); // p4
