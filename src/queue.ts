import { Concurrency } from ".";

export class Queue<T> extends Array<T> {
  private running = 0;

  constructor(
    public invoker: (item: T) => Promise<void>,
    public concurrency?: Concurrency
  ) {
    super();
    Object.setPrototypeOf(this, Queue.prototype);
  }

  override push(...items: T[]): number {
    const len = super.push(...items);
    this.next();
    return len;
  }

  private next() {
    if (!this.concurrency || this.running < this.concurrency) {
      this.dequeue();
    }
  }

  private dequeue() {
    const item = this.shift();
    if (item) {
      ++this.running;
      this.invoker(item).finally(() => {
        --this.running;
        this.next();
      });
    }
  }
}
