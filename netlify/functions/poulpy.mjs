import {createPoulpyHandler} from './lib/poulpy-core.mjs';
const handler=createPoulpyHandler({env:process.env});
export default request=>handler(request);
export const config={rateLimit:{windowLimit:5,windowSize:60,aggregateBy:['ip','domain']}};
