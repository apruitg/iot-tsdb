import * as express from 'express';

import UserCtrl from './controllers/user';
import CometCtrl from './controllers/sensor-value';
import {PassportStatic} from 'passport';
import {Application} from 'express';
import * as jwt from 'jsonwebtoken';





export default function setRoutes(app: Application, passport: PassportStatic) {

  const router = express.Router();


  const userCtrl = new UserCtrl();
  const sensorCtrl = new CometCtrl();



  const jwtAuth = passport.authenticate('jwt', { session: false});
  const isOwner = (extractor: (Request) => string) =>
    (req) => JSON.stringify(req.user._id) === JSON.stringify(extractor(req));
  const isAdmin = (req) => req.user.role === 'admin';
  const isAdminOrOwner = (extractor: (Request) => string) => (req) => isAdmin(req) || isOwner(extractor)(req);
  const checkPermission = condition => (req, res, next) =>
    condition(req) ? next() : res.status(403).send();

  const userId = r => r.users._id;

  const protectRole = (req, res, next) => {
    if (!isAdmin(req)) {
      delete req.body.role;
    }
    next();
  };

  app.use(passport.initialize());


  // SensorValues
  router.route('/STH/v1/contextEntities/type/:entityType/id/:entityId>/attributes/:attrName').post(sensorCtrl.process);

  // Users
  router.route('/login').post(userCtrl.login);
  router.route('/users').get(jwtAuth, checkPermission(isAdmin), userCtrl.getList);
  router.route('/users/count').get(jwtAuth, checkPermission(isAdmin), userCtrl.count);
  router.route('/users').post(userCtrl.setRoleAndProvider, userCtrl.insert, userCtrl.show);
  router.route('/users/:userId').get(jwtAuth, checkPermission(isAdminOrOwner(userId)), userCtrl.show);
  router.route('/users/:userId').put(jwtAuth, checkPermission(isAdminOrOwner(userId)), protectRole,
    userCtrl.update, userCtrl.show);
  router.route('/users/:userId').delete(jwtAuth, checkPermission(isAdmin), userCtrl.delete);

  router.param('userId', userCtrl.load);

  // GitHub Login
  router.route('/auth/github').get(
    passport.authenticate('github'));

  router.route('/auth/github/callback').get(
    passport.authenticate('github', { failureRedirect: '/login' , session: false}),
    (req, res) => {
      // Successful authentication, return JWT token.
      const token = jwt.sign({ user: req.user }, process.env.SECRET_TOKEN); // , { expiresIn: 10 } seconds
      res.status(200).json({ token: token });
    });

  // Apply the routes to our application with the prefix /api
  app.use('/', router);

}
