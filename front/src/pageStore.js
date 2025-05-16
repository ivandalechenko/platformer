import { makeAutoObservable } from 'mobx';

class PageStore {
    page = 'scene';

    constructor() {
        makeAutoObservable(this, {}, { autoBind: true, enforceActions: 'never' });
    }

    setPage(pg) {
        this.page = pg
    }

}

export default new PageStore();
