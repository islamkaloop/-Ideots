const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const validator = require("../../validations/taskValidations");


const Joi = require("joi");


// We will be connecting using database
const Task = require("../../models/Task");
const User = require("../../models/User");
const Admin = require("../../models/Admin");

const notificationController = require("../../controllers/sendNotificationController");


router.get("/", async (req, res) => {
  const tasks = await Task.find()
    .populate("partnerID")
    .populate("consultancyID");
  res.json({ data: tasks });
});


router.get("/WithRange/:limit/:offset", async (req, res) => {
  const schema = {
    limit: Joi.required(),
    offset: Joi.required()
  };
  const result = Joi.validate(req.params, schema);
  if (result.error)
    return res.status(400).send({ error: result.error.details[0].message });
  const limit = parseInt(req.params.limit, 10);
  const offset = parseInt(req.params.offset, 10);
  const task = await Task.find()
    .skip(offset)
    .limit(limit);
  res.json({ data: task });
});


router.get("/:id", async (req, res) => {
  try {
    const taskID = req.params.id;
    const task = await Task.findOne({ _id: taskID })
      .populate("partnerID")
      .populate("consultancyID");
    if (!task) return res.status(400).send({ error: "Task does not exist" });
    return res.json({ task });
  } catch (error) {
    console.log(error);
  }
});

//get my tasks
router.get("/Partner/:id", async (req, res) => {
    try {
      const partnerId = req.params.id;
      const task = await Task.find({ partnerID: partnerId })
        .populate("partnerID")
        .populate("consultancyID");
      if (!task) return res.status(400).send({ error: "Task does not exist" });
      return res.json({ task });
    } catch (error) {
      console.log(error);
    }
  });



router.post("/", async (req, res) => {
  try {
    const isValidated = validator.createValidation(req.body);
    if (isValidated.error)
      return res
        .status(400)
        .send({ error: isValidated.error.details[0].message });
    const newTask = await Task.create(req.body);


    //------------------------(Notify members)-------------------------------------
    const taskId = newTask._id;
    await notificationController.notifyAllMembers(taskId,`New Task is posted`);
    //------------------------(Notify Admins)-------------------------------------
    await notificationController.notifyAdmins(taskId,`New Task is posted`);
    //------------------------(Notify Partner that his request is accepted)-------------------------------------
    const recieverId = newTask.partnerID;
    await notificationController.notifyUser(taskId,recieverId,`Your task request has been accepted and your task is posted`);
    //------------------------------------------------------------------

    res.json({ msg: "Task was created successfully", data: newTask });
  } catch (error) {
    // We will be handling the error later
    console.log(error);
  }
});

router.put("/:id", async (req, res) => {
  try {

    const taskId = req.params.id;
    const taskApplicant = req.body.applicants;
    const assignedPerson= req.body.assignedPerson;
    const task = await Task.findById(taskId);

    if (!task) return res.status(400).send({ error: "Task does not exist" });
    const isValidated = validator.updateValidation(req.body);
    if (isValidated.error)
      return res
        .status(400)
        .send({ error: isValidated.error.details[0].message });
    if (!taskApplicant) {
      if(assignedPerson){
        //-------------(Notify assigned person that he was accepted)--------------------
        const recieverId =assignedPerson;
        await notificationController.notifyUser(taskId,recieverId,`You are accepted to work on task `);
      //-------------(Notify admins that an applicant was choosen)--------------------
     await notificationController.notifyAdmins(taskId,`An applicant was choosen to complete the task `);
       //--------------------------------------------- 
      }
      await Task.updateOne({ _id: taskId }, req.body);
    } else {
      await Task.update(
        { _id: taskId },
        { $addToSet: { applicants: taskApplicant } }
      );
      //-------------(Notify partner that new applicant applied on task)--------------------
      const recieverId = task.partnerID;
      await notificationController.notifyUser(taskId,recieverId,`New applicant applied on task `);
      //-------------(Notify admin that new applicant applied on task)--------------------
      await notificationController.notifyAdmins(taskId,`New applicant applied on task `);
       //--------------------------------------------- 
    }
    //  const updatedTask = await Task.updateOne({'_id':taskId},req.body)
    res.json({ msg: "Task updated successfully" });
  } catch (error) {
    // We will be handling the error later
    console.log(error);
  }
});

router.delete("/:id", async (req, res) => {
  try {

    const taskId = req.params.id;
    const deletedTask = await Task.findByIdAndRemove(taskId);
    if (!deletedTask)
      return res.status(400).send({ error: "task does not exist" });

    //-------------(Notify admin that task is deleted)--------------------
    await notificationController.notifyAdmins(taskId,`Task is deleted`);
    //---------------------------------------------   


    res.json({ msg: "Task was deleted successfully", data: deletedTask });
  } catch (error) {
    // We will be handling the error later
    console.log(error);
  }
});

// **searching for tasks**

//search by category
router.get("/search/category=:cat", async (req, res) => {
  const cat = req.params.cat;


  const tasks = await Task.find({ category: { $regex: cat, $options: "i" } })
    .populate("partnerID")
    .populate("consultancyID");
  // if(tasks.length==0)return res.status(404).send({error: 'no tasks found'})
  return res.json({ data: tasks });
});

//search by year of experience
router.get("/search/experience=:exp", async (req, res) => {
  const exp = req.params.exp;
  const tasks = await Task.find({ yearsOfExperience: exp })
    .populate("partnerID")
    .populate("consultancyID");
  // if(tasks.length==0) return res.status(404).send({error: 'no tasks found'})
  return res.json({ data: tasks });
});

//search by monetary compensation *********************************************************************************************
router.get("/search/payment=:pay", async (req, res) => {
  const pay = req.params.pay;
  const min = Number(pay) - 50;
  const max = Number(pay) + 50;
  const tasks = await Task.find({ payment: { $lte: max, $gte: min } })
    .populate("partnerID")
    .populate("consultancyID");
  // if(tasks.length==0) return res.status(404).send({error: 'no tasks found'})
  return res.json({ data: tasks });
});

//recommended tasks
router.get("/recommended/:id", async (req, res) => {
  const id = req.params.id;
  const user = await User.findById(id)
    .populate("partnerID")
    .populate("consultancyID");
  const userSkills = user.skills;
  const tasks = await Task.find({ requiredSkills: { $in: userSkills } });
  // if(tasks.length==0) return res.status(404).send({error: 'No tasks suitable for you at the moment, Try something new ?'})
  return res.json({ data: tasks });
});

module.exports = router;
