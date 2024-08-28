import './common/env';
import Server from './server';

const port = parseInt(process.env.PORT ?? '3000');
export default (new Server()).listen(port);
