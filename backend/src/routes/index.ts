import { Router } from 'express';
import { quotesRouter } from './quotes';
import { offersRouter } from './offers';
import { closingRouter } from './closing';
import { stateRouter } from './state';
import { simulationRouter } from './simulation';

export const apiRouter = Router();

apiRouter.use('/quotes', quotesRouter);
apiRouter.use('/offers', offersRouter);
apiRouter.use('/closing', closingRouter);
apiRouter.use('/simulation', simulationRouter);
apiRouter.use('/', stateRouter);
