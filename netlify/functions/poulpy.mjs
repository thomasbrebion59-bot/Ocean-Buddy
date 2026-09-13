import {createPoulpyHandler} from './lib/poulpy-core.mjs';
const handler=createPoulpyHandler();
export default (request,context)=>handler(request,{ip:context.ip});
export const config={rateLimit:{windowLimit:6,windowSize:60,aggregateBy:['ip','domain']}};
