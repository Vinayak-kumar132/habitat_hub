const User = require("../models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { errorHandler } = require("../utils/error");
require('dotenv').config();

exports.signup = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(403).json({
        success: false,
        message: "all fields are required",
      });
    }
    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
    });
  } catch (error) {
    next(error);
  }
};

exports.signin = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(403).json({
      success: false,
      message: "please fill up all the fields",
    });
  }
  try {
    const validUser = await User.findOne({ email });
    if (!validUser) {
      return next(errorHandler(404, "User not found"));
    }
    const validPassword = bcrypt.compareSync(password, validUser.password);
    if (!validPassword) {
      return next(errorHandler(401, "Wrong Credential"));
    }

    const token = jwt.sign({ id: validUser._id }, process.env.JWT_SECRET);
    const {password:pass,...rest} = validUser._doc;
    res
      .cookie("access_token", token, { httpOnly: true })
      .status(200)
      .json(rest);
  } catch (error) {
    next(error);
  }
};

exports.google = async(req,res,next)=>{
  try{
    const user = await User.findOne({email:req.body.email});
    if(user)
    {
      const token = jwt.sign({id:user._id},process.env.JWT_SECRET);
      const {password:pass, ...rest}=user._doc;
      res.cookie('access_token',token,{httpOnly:true})
      .status(200)
      .json(rest);

    }else{
      const generatePassword = Math.random().toString(36).slice(-8) +  Math.random().toString(36).slice(-8);
      const hashedPassword = bcrypt.hashSync(generatePassword,10);
      const newUser = new User({username:req.body.name.split(" ").join("").toLowerCase()+ Math.random().toString(36).slice(-4),
      password:hashedPassword,email:req.body.email,avatar:req.body.photo});
      await newUser.save();
      const token = jwt.sign({id:newUser._id},process.env.JWT_SECRET);
      const {password:pass,...rest} = newUser._doc;
      res.cookie('access_token',token,{httpOnly:true})
      .status(200).json(rest);
    }

  }catch(error){
    next(error);
  }
}

exports.signOut = (req,res,next)=>{

  try{
    res.clearCookie('access_token');
    res.status(200).json('user has been logged out');
  }catch(error){
    next(error);
  }
}