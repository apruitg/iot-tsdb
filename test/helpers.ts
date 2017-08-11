import {IUser, IUserModel} from '../server/models/types';
import User from '../server/models/user';
import * as jwt from 'jsonwebtoken';


export const range = (size: number): Array<number> => {
  const result = Array<number>(size);
  for (let i = 0; i < size; i += 1) {
    result[i] = i + 1;
  }
  return result;
};

export const createUsers = (number, prefix = 'user', role = 'user'): Array<IUser> =>
  range(number).map(nr => ({
    username: `${prefix}${nr}`,
    email: `${prefix}${nr}@test.com`,
    password: 'topsecret',
    provider: 'local',
    role : role
  }));

export const saveUsers = (users: Array<IUser>): Promise<[IUserModel]> =>
  Promise.all(users.map(u => new User(u).save()));

export const getToken = (user: IUser) => jwt.sign({ user: user }, process.env.SECRET_TOKEN);
