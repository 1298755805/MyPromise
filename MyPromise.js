// promise的状态枚举
const STATUS = {
  PENDING: 0,
  FULFILLED: 1,
  REJECTED: 2,
};

class MyPromise {
  constructor(task) {
    this.status = STATUS.PENDING; // promise初始状态
    this.resolveData = null; // resolve时传递的数据
    this.rejectData = null; // reject时传递的数据

    this.onFulfilledList = []; // 成功回调任务队列
    this.onRejectedList = []; // 失败回调任务队列

    /**
     * @description: promise成功：
     * 1.把status修改成FULFILLED状态
     * 2.逐一执行onFulfilledList回调任务队列中的函数
     * @param {*} data
     */
    this.resolve = (data) => {
      if (this.status == STATUS.PENDING) {
        this.status = STATUS.FULFILLED;
        // console.log('执行了resolve');
        this.resolveData = data;
        this.onFulfilledList.forEach((fn) => {
          fn(this.resolveData);
        });
      }
    };

    /**
     * @description: promise失败：
     * 1.把status修改为REJECTED状态
     * 2.逐一执行onRejectedList回调任务队列中的函数
     * @param {error} data
     */
    this.reject = (data) => {
      if (this.status == STATUS.PENDING) {
        this.status = STATUS.REJECTED;
        this.rejectData = data;
        this.onRejectedList.forEach((fn) => {
          fn(this.rejectData);
        });
      }
    };

    try {
      task(this.resolve.bind(this), this.reject.bind(this));
    } catch (e) {
      this.reject(e);
    }
  }

  /**
   * @description: 处理then函数中的返回值，如果返回的是promise对象，则根据promise对象的status进行相应的处理，若return值不为promise则直接resolve
   * @param {当前then return的数据} returnData
   * @param {当前then返回的promise的resolve} resolve
   * @param {当前then返回的promise的resolve} reject
   */
  handleReturn(returnData, resolve, reject) {
    if (returnData instanceof MyPromise) {
      // then的返回值是一个promise
      if (returnData.status == STATUS.PENDING) {
        // 等待返回的promise状态改变后再执行下一个回调
        returnData.then(resolve, reject);
      } else if (returnData.status == STATUS.FULFILLED) {
        // 若return的promise已经是fulfilled了，则直接resolve他的resolveData
        resolve(returnData.resolveData);
      } else if (returnData.status == STATUS.REJECTED) {
        // 同上
        reject(returnData);
      }
    } else {
      // then的返回值是基本数据或者是undefined，直接把returnData给resolve了
      // console.log('return的不是promise');
      resolve(returnData);
    }
  }

  /**
   * @description: then回调函数，若传入的参数是函数的话，则以目前promise对象的数据为参数放入then的参数函数中，并把它推入到当前promise对象的回调任务队列中，等待promise执行到resolve/reject时回调执行任务队列的函数
   * @param {成功的回调函数} onFulfilled
   * @param {失败的回调函数} onRejected
   * @return {MyPromise}
   */
  then(onFulfilled, onRejected) {
    let promise;
    if (this.status == STATUS.PENDING) {
      promise = new MyPromise((resolve, reject) => {
        /* 若当前状态为PENDING则把回调函数推到任务队列中，等待resolve后执行 */
        // 这个this指向的是外面的MyPromise
        this.onFulfilledList.push(() => {
          const returnData = onFulfilled(this.resolveData);
          this.handleReturn(returnData, resolve, reject);
        });
      });
    } else if (this.status == STATUS.FULFILLED) {
      promise = new MyPromise((resolve, reject) => {
        /* 若当前状态为FULFILLED则直接执行回调函数 */
        const returnData = onFulfilled(this.resolveData);
        this.handleReturn(returnData, resolve, reject);
      });
    } else if (this.status == STATUS.REJECTED) {
      promise = new MyPromise((resolve, reject) => {
        /* 若当前状态为REJECTED则直接执行回调函数 */
        const returnData = onRejected(this.resolveData);
        this.handleReturn(returnData, resolve, reject);
      });
    }

    return promise;
  }

  /**
   * @description: catch方法，相当于调用了then方法，但是之传入了onRejected
   * @param {*} onRejected
   */
  catch(onRejected) {
    this.then(undefined, onRejected);
  }

  /**
   * @description: 静态resolve方法
   * @param {*} value
   * @return {MyPromise}
   */
  static resolve(value) {
    if (value instanceof MyPromise) {
      return value;
    }
    return new MyPromise((resolve, reject) => {
      resolve(value);
    });
  }

  /**
   * @description: 静态reject方法
   * @param {*} value
   * @return {MyPromise}
   */
  static reject(value) {
    if (value instanceof MyPromise) {
      return value;
    }
    return new MyPromise((resolve, reject) => {
      reject(value);
    });
  }

  /**
   * @description: 静态方法all
   * @param {一个由promise组成的任务数组} promiseArray
   * @return {MyPromise}
   */
  static all(promiseArray) {
    return new MyPromise((resolve, reject) => {
      const result = []; // 返回的结果数组
      let count = 0; // 成功任务数目
      for (let [i, p] of promiseArray.entries()) {
        // 如果当前数组元素不是MyPromise实例则先调用resolve方法转成MyPromise实例
        this.resolve(p).then(
          (res) => {
            result.push(res);
            count++;
            // 如果所有任务都成功了，则MyPromise的状态变为fulfilled
            if (count == promiseArray.length) resolve(result);
          },
          (err) => {
            // 若有一个出错了，则MyPromise的状态则直接变为Rejected
            reject(err);
          }
        );
      }
    });
  }

  /**
   * @description: 静态方法race
   * @param {一个由promise组成的任务数组} promiseArray
   * @return {MyPromise}
   */
  static race(promiseArray) {
    return new MyPromise((resolve, reject) => {
      for (let p of promiseArray) {
        // 只要有一个实例率先改变了状态，则MyPromise的状态就会跟着改变
        this.resolve(p).then(
          (res) => {
            resolve(res);
          },
          (err) => {
            reject(err);
          }
        );
      }
    });
  }
}

module.exports = MyPromise;
