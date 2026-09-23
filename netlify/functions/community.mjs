import {createCommunityHandler} from './lib/community-handler.mjs';

const handler=createCommunityHandler();
export default request=>handler(request);
export const config={rateLimit:{windowLimit:60,windowSize:60,aggregateBy:['ip','domain']}};
