export default function(expireIn = -1): MethodDecorator {
    return function(target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor): PropertyDescriptor {
        const neverExpire = expireIn === -1;
        let originalFunction: string = descriptor.value.toString();
        const isAsync = originalFunction.startsWith('async');

        if (isAsync) {
            originalFunction = originalFunction.substring('async '.length);
        }

        descriptor.value = new Function('...__args', 
            `
            var __f = ${isAsync ? 'async ' : ''}function ${originalFunction}.bind(this);
            var __params;
            try {
                __params = '__CACHE__${propertyKey.toString()}__' + JSON.stringify(__args);
            }
            catch(e) {
                console.log('Could not CACHE method "${propertyKey.toString()}". This may be due circular referencing in one or more arguments:', __args);
                return __f(...__args);
            }

            if(this[__params] !== undefined) {
                return this[__params];
            }

            var __result = __f(...__args);
            this[__params] = __result;

            var __expire = function() {
                this[__params] = undefined;
            }.bind(this);

            var __expireIn = ${expireIn};

            ${!neverExpire ? 'setTimeout(__expire, __expireIn);' : ''}
            return __result;
            `
        )
        return descriptor;
    }
}
