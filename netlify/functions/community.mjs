import {createCommunityHandler} from './lib/community-handler.mjs';

const handler=createCommunityHandler();
// context.ip feeds the in-memory per-IP write limit of the handler.
export default (request,context)=>handler(request,{ip:context?.ip});
export const config={rateLimit:{windowLimit:60,windowSize:60,aggregateBy:['ip','domain']}};
