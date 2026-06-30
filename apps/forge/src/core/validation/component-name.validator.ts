import { RESERVED_COMPONENT_NAMES }
from "../constants/reserved-component-names.js";

export function validateComponentName(name:string):void{

    if(
        RESERVED_COMPONENT_NAMES.includes(
            name as never
        )
    ){

        throw new Error(

            `"${name}" is a reserved package name.`

        );

    }

}
