const {faker} = require("@faker-js/faker");
export default class Utils{
    static id(){
        return faker.datatype.uuid();
    }

}
