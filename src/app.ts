import express from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';
import { AppDataSource } from "./data-source";
import { User } from "./entity/User";
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

const app = express();
const port = 3000;

dotenv.config();
process.env.TOKEN_SECRET;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// authentication //

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]  
  if (token == null) return res.sendStatus(401) // unauthorized
  jwt.verify(token, process.env.TOKEN_SECRET as string, (err: any, user: any) => {
    console.log("authenticate", err)
    if (err) return res.sendStatus(403) // forbidden
    req.user = user
    next()
  })
}

// validation //

// id validation
const userExists = async (id: string) => {
  const user = await AppDataSource.manager.findOneBy(User, { id: id })
  if(!user){
    throw new Error('User not found');
  }
  return true;
}
const idValidation = () => body('id').trim().notEmpty().escape().isUUID().custom(userExists);

// name validation
const nameValidation = () => body('name').trim().notEmpty().escape();

const emailValidation = (crudop: string = 'create') => {
  let emailIsUnique;
  if(crudop === 'create'){
    emailIsUnique = async (email: string) => {
      const user = await AppDataSource.manager.findOneBy(User, { email: email });
      if(user){
        throw new Error('Email must be unique');
      }
    };
  }
  else if (crudop === 'update'){
    emailIsUnique = async (email: string, { req }) => {
      const user = await AppDataSource.manager.findOneBy(User, { email: email });
      const user_id = req.body.id;
      if(user && user.id != user_id){
        throw new Error('Email must be unique');
      }
    };
  }  
  return body('email').trim().notEmpty().escape().isEmail().custom(emailIsUnique);
}
// const emailValidation = () => body('email').trim().notEmpty().escape().isEmail();

// password validation
const passwordIsValid = (value: string) => {
  const passwordRegex = /^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]*$/;
  if (!passwordRegex.test(value)) {
    throw new Error('Password can only contain letters, numbers, and special characters');
  }
  return true;
}
const passwordValidation = () => body('password').trim().notEmpty().escape().custom(passwordIsValid);

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
const updateValidations = [idValidation(), nameValidation(), emailValidation('update'), passwordValidation()]
const deleteValidations = [idValidation()]

// endpoints //

// home
app.get('/', async (req, res) => {
  return res.status(200).send('Hello!');
});

// list
app.get('/users', authenticateToken, async (req, res) => {
  try {
    const users = await AppDataSource.getRepository(User).find({ order: { email: 'asc' } });
    return res.status(200).json(users);
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
  newUser.password = req.body.password  

  try{
    const user = await AppDataSource.manager.save(newUser)
    const token = jwt.sign({ id: user.id }, process.env.TOKEN_SECRET, { expiresIn: '1800s' })
    return res.status(200).json({ id: user.id, name: user.name, email: user.email, password: user.password, token: token});
  }
  catch (error) {
    console.log("create", error)
    return res.status(500).json({ error: `User not created: `+ error });
  }
});

// update
app.patch('/users/update', authenticateToken, validate(updateValidations), async (req, res) => {
  const user_id = req.body.id;
  const updatedUser = {
    name: req.body.name,
    email: req.body.email,
    password: req.body.password
  }

  try{
    await AppDataSource.getRepository(User).update({id: user_id}, updatedUser)
    const user = await AppDataSource.manager.findOneBy(User, { id: user_id })
    return res.status(200).json(user);
  }
  catch (error) {
    console.log("update", error)
    return res.status(500).json({ error: `User ${user_id} not updated: `+ error });
  }
});

// delete
app.delete('/users/delete', authenticateToken, validate(deleteValidations), async (req, res) => {
  const user_id = req.body.id
  try{
    await AppDataSource.getRepository(User).delete(user_id);  
    return res.status(200).json({ message: `User ${user_id} successfully deleted`});
  }
  catch (error) {
    console.log("delete", error)
    return res.status(500).json({ error: `User ${user_id} not deleted: `+ error });
  }
});

//login
app.post('/login', async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
});

AppDataSource.initialize()
.then(async () => {
  const users = await AppDataSource.getRepository(User).find({ order: { email: 'asc' } });
  console.log("initialize users", users)
})
.catch(error => {
  console.log("initialize", error)
});

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});