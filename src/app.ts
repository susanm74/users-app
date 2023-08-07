import express from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';
import { AppDataSource } from "./data-source";
import { User } from "./entity/User";
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
// import expressOasGenerator from 'express-oas-generator';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;
console.log('port', port);

const saltRounds = 10;
const salt = bcrypt.genSaltSync(saltRounds);

// expressOasGenerator.init(app, {});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// authentication //

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]  
  if (token == null) return res.status(401).json({ error: 'Unauthorized'}); // unauthorized
  jwt.verify(token, process.env.TOKEN_SECRET as string, (err: any, user: any) => {
    console.log("authenticate", err)
    if (err) return res.status(403).json({ error: 'Forbidden'}); // forbidden
    req.user = user
    next()
  })
}

// validation //

// name validation
const nameValidation = () => body('name').trim().notEmpty().escape().withMessage('Name is required');

const emailValidation = (action: string = 'create') => {
  if(action === 'create'){
    const emailIsUnique = async (email: string) => {
      const user = await AppDataSource.manager.findOneBy(User, { email: email });
      if(user){
        throw new Error('Email must be unique');
      }
    };
    return body('email').trim().notEmpty().escape().isEmail().custom(emailIsUnique);
  }
  else if (action === 'login' || action === 'update' || action === 'delete'){
    const emailExists = async (email: string) => {
      const user = await AppDataSource.manager.findOneBy(User, { email: email })
      if(!user){
        throw new Error(`Email not found`);
      }
      return true;
    }
    return body('email').trim().notEmpty().escape().isEmail().withMessage('Email is required').custom(emailExists);
  }
  else{
    return body('email').trim().notEmpty().escape().isEmail().withMessage('Email is required');
  }
}

// password validation
const passwordIsValid = (value: string) => {
  const passwordRegex = /^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]*$/;
  if (!passwordRegex.test(value)) {
    throw new Error('Password can only contain letters, numbers, and special characters');
  }
  return true;
}
const passwordValidation = () => body('password').trim().notEmpty().escape().withMessage('Password is required').custom(passwordIsValid);

const validate = (validations: ValidationChain[]) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    for (const validation of validations) {
      const result = await validation.run(req);
      if (!result.isEmpty()) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({ errors: errors.array() });
  };
};

const createValidations = [nameValidation(), emailValidation('create'), passwordValidation()]
const updateValidations = [nameValidation(), emailValidation('update'), passwordValidation()]
const deleteValidations = [emailValidation('delete')]

// endpoints //

// home
app.get('/', async (req, res) => {
  return res.status(200).send('Hello!');
});

// list
app.get('/users', authenticateToken, async (req, res) => {
  try {
    const users = await AppDataSource.getRepository(User).find({ order: { email: 'asc' } });
    const list = users.map(({ name, email }) => ({ name, email }));
    return res.status(200).json(list);
  }
  catch (error) {
    console.log("list", error)
    return res.status(500).json({ error: `Users not found: ` + error});
  }
});

// create
app.post('/users/create', validate(createValidations), async (req, res) => {    
  const newUser = new User()
  newUser.name = req.body.name
  newUser.email = req.body.email
  newUser.password = bcrypt.hashSync(req.body.password, salt);
  try{
    const user = await AppDataSource.manager.save(newUser)
    const token = jwt.sign({ id: user.id }, process.env.TOKEN_SECRET, { expiresIn: process.env.TOKEN_EXPIRESIN })
    res.setHeader('authorization', `Bearer ${token}`)
    return res.status(200).json({ message: `User ${user.email} successfully created`});
  }
  catch (error) {
    console.log("create", error)
    return res.status(500).json({ error: `User not created: `+ error });
  }
});

//login
app.post('/login', async (req, res) => {  
  const email = req.body.email;
  const password = req.body.password
  const user = await AppDataSource.manager.findOneBy(User, { email: email });
  if(!user){
    return res.status(401).send({ error: 'Email incorrect, please try again.'});
  }

  if (bcrypt.compareSync(password, user.password)) {
    const token = jwt.sign({ id: user.id }, process.env.TOKEN_SECRET, { expiresIn: '1800s' })
    res.setHeader('authorization', `Bearer ${token}`)
    return res.status(200).send({ message: `Welcome back, ${user.name}!`});
  } else {
    return res.status(401).send({ error: 'Password incorrect, please try again.'});
  }

});

// update
app.patch('/users/update', authenticateToken, validate(updateValidations), async (req, res) => {
  const email = req.body.email;
  const updatedUser = {
    name: req.body.name,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, salt)
  }
  try{
    await AppDataSource.getRepository(User).update({email: email}, updatedUser)
    const user = await AppDataSource.manager.findOneBy(User, { email: email })
    return res.status(200).json({ message: `User ${user.email} successfully updated`});
  }
  catch (error) {
    console.log("update", error)
    return res.status(500).json({ error: `User ${email} not updated: `+ error });
  }
});

// delete
app.delete('/users/delete', authenticateToken, validate(deleteValidations), async (req, res) => {
  const email = req.body.email
  try{
    await AppDataSource.getRepository(User).delete({ email: email });
    return res.status(200).json({ message: `User ${email} successfully deleted`});
  }
  catch (error) {
    console.log("delete", error)
    return res.status(500).json({ error: `User ${email} not deleted: `+ error });
  }
});

// db initialization //

AppDataSource.initialize()
// .then(async () => {
//   const users = await AppDataSource.getRepository(User).find({ order: { email: 'asc' } });
//   console.log("initialize users", users)
// })
// .catch(error => {
//   console.log("initialize", error)
// });

// app initialization //

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});

export default app;