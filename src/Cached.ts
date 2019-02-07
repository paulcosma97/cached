import logger from "@jeaks03/logger";

export default function Cached(expireIn = -1): MethodDecorator {
    return function(target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor): PropertyDescriptor {
        const neverExpire = expireIn === -1;
        let originalFunction: string = descriptor.value.toString();
        const isAsync = originalFunction.startsWith('async');

        if (isAsync) {
            originalFunction = originalFunction.substring('async '.length);
        }

        const oldFunction = descriptor.value;
        descriptor.value = function(...__args) {
            const __f = oldFunction.bind(target);
            let __params;
            try {
                __params = `__CACHE__${propertyKey.toString()}__` + JSON.stringify(__args);
            }
            catch(e) {
                logger.warn('Cached', 'Could not CACHE method {}. This may be due circular referencing in one or more arguments:', propertyKey.toString(), __args);
                return __f(...__args);
            }

            if(target[__params] !== undefined) {
                return target[__params];
            }

            const __result = __f(...__args);
            target[__params] = __result;

            const __expire = function() {
                target[__params] = undefined;
            };

            if(!neverExpire) {
                setTimeout(__expire, expireIn);
            }

            return __result;
        }.bind(target);

        return descriptor;
    }
}