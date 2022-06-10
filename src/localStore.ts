import Loki from "lokijs";
import * as _ from "lodash";
import Utils from "@/utils";

const WidgetCollectionName = "Widgets";
/*
* Defines the elements of a script/widget item.
* */
export type Widget = { id: string, text: string, description: string, visualization: string, code: string, data:any };
export default class LocalStore {
    private store: Loki;

    constructor() {

    }

    async init() {
        return new Promise((resolve, reject) => {
            this.store = new Loki("store.json", {
                env: "BROWSER",
                filePath: "store.json",
                autosave: true,
                autoload: true,
                autosaveInterval: 2000,
                autoloadCallback: () => {
                    resolve(true);
                }
            });
        });
    }

    addItem(item:Widget) {
        this.checkItem(item);
        const found = this.getItemById(item.id);
        if (found) {
            throw new Error(`An item with id '${item.id}' already exists.`);
        }
        const coll = this.getOrCreateCollection(WidgetCollectionName);
        coll.insert(item);

    }

    async upsertItem(item) {
        this.checkItem(item);
        const found = this.getItemById(item.id);
        const coll = this.getOrCreateCollection(WidgetCollectionName);

        if (found) {
            await this.update(item, WidgetCollectionName, {id: item.id});
        } else {
            await this.addItem(item);
        }
    }

    async removeItem(item) {
        const coll = this.getOrCreateCollection(WidgetCollectionName);
        coll.findAndRemove({id: item.id});
    }

    async update(blob, collectionName, condition) {
        const coll = this.getOrCreateCollection(collectionName);
        coll.findAndUpdate(condition, (found) => _.assign(found, blob));
    }

    /**
     * Checks that the item has an id and is a plain object.
     * @param item
     */
    checkItem(item) {
        if (_.isNil(item)) {
            throw new Error("Input is nil.");
        }
        if (!_.isPlainObject(item)) {
            item = JSON.parse(JSON.stringify(item));
        }
        if (_.isNil(item.id)) {
            item.id = Utils.id();
        }
    }

    getItemById(id) {
        const coll = this.getOrCreateCollection(WidgetCollectionName);
        return coll.findOne({id});
    }

    getOrCreateCollection(collectionName) {
        let found = this.store.getCollection(collectionName);
        if (!found) {
            found = this.store.addCollection(collectionName);
        }
        return found;
    }

    idExists(id){
        return !_.isNil(this.getItemById(id))
    }

    getWidgetList(){
        const coll = this.getOrCreateCollection(WidgetCollectionName);
        return coll.find({}).map(u=>({text:u.text,id:u.id}));
    }
}
