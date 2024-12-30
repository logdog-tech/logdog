interface Observer {
    append(oldCount: number, newCount: number): void;
    clear(): void;
    reset(): void;
}

import type { BaseLine } from "../modules/base";

export class BaseAdapter<T> {
    private observers: Set<Observer> = new Set();

    subscribe(observer: Observer): void {
        console.log('subscribe', observer);
        this.observers.add(observer);
    }

    unsubscribe(observer: Observer): void {
        this.observers.delete(observer);
    }

    getCount(): number {
        throw new Error('Not implemented');
    }

    getObservers(): Set<Observer> {
        return this.observers;
    }

    getItem(index: number): T {
        throw new Error('Not implemented');
    }

    flush(): void {
        throw new Error('Not implemented');
    }

    clear(): void {
        throw new Error('Not implemented');
    }

    append(data: T | T[]): void {
        throw new Error('Not implemented');
    }
}


export class DataAdapter<T> extends BaseAdapter<T> {
    _items: T[] = [];

    protected getItems(): T[] {
        return this._items;
    }

    clear(): void {
        this._items = [];
        for (const observer of this.getObservers()) {
            observer.clear();
        }
    }

    getCount(): number {
        return this._items.length;
    }

    getItem(index: number): T {
        return this._items[index];
    }

    reset(data: T | T[]): void {
        this._items = [];
        if (Array.isArray(data)) {
            const CHUNK_SIZE = 10000;
            for (let i = 0; i < data.length; i += CHUNK_SIZE) { // 不切片对于超大数组会有栈溢出问题，想别的办法更高效一些
                const chunk = data.slice(i, i + CHUNK_SIZE);
                this._items.push(...chunk);
            }
        } else {
            this._items.push(data);
        }

        for (const observer of this.getObservers()) {
            observer.reset();
        }
    }

    append(data: T | T[]): void {
        console.log('append', data);
        const oldCount = this.getCount();
        if (Array.isArray(data)) {
            const CHUNK_SIZE = 10000;
            for (let i = 0; i < data.length; i += CHUNK_SIZE) { // 不切片对于超大数组会有栈溢出问题，想别的办法更高效一些
                const chunk = data.slice(i, i + CHUNK_SIZE);
                this._items.push(...chunk);
            }
        } else {
            this._items.push(data);
        }
        for (const observer of this.getObservers()) {
            observer.append(oldCount, this.getCount());
        }
    }
}

export class FilterDataAdapter<T> extends BaseAdapter<T> {
    _dataAdapter: DataAdapter<T>;
    _filtedItemIndexes: number[] = [];
    _filterFunction: (item: T) => boolean = function (item: T) {
        return true;
    }

    constructor(dataAdapter: DataAdapter<T>) {
        super();
        this._dataAdapter = dataAdapter;
        const self = this;
        dataAdapter.subscribe({
            append: function (oldCount: number, newCount: number) {
                for (let i = oldCount; i < newCount; i++) {
                    if (self._filterFunction(dataAdapter.getItem(i))) {
                        self._filtedItemIndexes.push(i);
                    }
                }
            },
            clear: function () {
                self._filtedItemIndexes = [];
            },
            reset: function () {
                self._filtedItemIndexes = [];
                const items = dataAdapter._items;
                for (let i = 0; i < items.length; i++) {
                    if (self._filterFunction(items[i])) {
                        self._filtedItemIndexes.push(i);
                    }
                }
            }
        });
    }

    setFilterFunction(filterFunction: (item: T) => boolean): void {
        this._filterFunction = filterFunction;
        this._filtedItemIndexes = [];

        const items = this._dataAdapter._items;
        for (let i = 0; i < items.length; i++) {
            if (filterFunction(items[i])) {
                this._filtedItemIndexes.push(i);
            }
        }
    }

    getCount(): number {
        return this._filtedItemIndexes.length;
    }

    getItem(index: number): T {
        return this._dataAdapter.getItem(this._filtedItemIndexes[index]);
    }

    clear(): void {
        this._filtedItemIndexes = [];
    }

    flush(): void {
        this._filtedItemIndexes = [];
        const items = this._dataAdapter._items;
        for (let i = 0; i < items.length; i++) {
            if (this._filterFunction(items[i])) {
                this._filtedItemIndexes.push(i);
            }
        }
    }
}

export const dataAdapter = new DataAdapter<BaseLine>();
export const filterDataAdapter = new FilterDataAdapter<BaseLine>(dataAdapter);
