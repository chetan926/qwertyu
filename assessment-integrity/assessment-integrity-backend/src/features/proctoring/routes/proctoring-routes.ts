import { Router, type IRouter } from 'express';
import { faceCheck } from '../controllers/proctoring-controller';

const router: IRouter = Router();

// POST /api/proctoring/face-check
router.post('/face-check', faceCheck);

export { router as proctoringRouter };
