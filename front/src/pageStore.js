import { makeAutoObservable } from 'mobx';

class PageStore {
    page = 'scene';

    constructor() {
        makeAutoObservable(this);
    }

    setPage(pg) {
        this.page = pg
    }

}

export default new PageStore();
