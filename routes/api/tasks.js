const express = require('express') 
const router = express.Router();
const Joi = require('joi');
const Task = require('../../models/Task')

const tasks=[

new Task(1,1,"hello it is me " , "js and css " , 1500 , "link here " , "dunno " , "dont know " , "computer science " ,
15 , false , 5.0 , 4.8 , "ahmad 3loka " ) 
, new Task(2,2,"i want a car " , "mechanics" , 1780 , "link here " , "dunno " , "dont know " , "mechanical science " ,
10 , true , 5.0 , 3.1 , "ibrahem ahmed " ) 
]; 

router.get('/' , (req , res ) =>{
res.json({data : tasks })
}) ; 

router.get('/:taskID', (req, res) => { 
const taskID = req.params.taskID 
const task = tasks.find(x => x.taskID === taskID); 
return res.json({task});
});

router.post('/' , (req , res ) => { 
const partnerID = req.body.partnerID
const consultancyID = req.body.consultancyID 
const description = req.body.description 
const requiredSkills = req.body.requiredSkills
const payment =(Number) (req.body.payment)
const finalProduct = req.body.finalProduct
const timeLine = req.body.timeLine
const lifeCycle = req.body.lifeCycle
const category = req.body.category
const yearsOfExperience =(Number) (req.body.yearsOfExperience)
const done =(Boolean) (req.body.Done)
const ratePartnerDoer =(Number) (req.body.ratePartnerDoer)
const ratePartnerConsultancy = (Number) (req.body.ratePartnerConsultancy)
const assignedPerson = req.body.assignedPerson
const schema = { 
partnerID : Joi.required() , 
consultancyID : Joi.required() , 
description : Joi.string().required() , 
requiredSkills : Joi.string().required() , 
payment : Joi.number().required() ,
finalProduct : Joi.string() , 
timeLine : Joi.string() , 
lifeCycle: Joi.string() , 
category : Joi.string().required() ,
yearsOfExperience : Joi.number(),
done : Joi.boolean().required() ,
ratePartnerDoer : Joi.number() ,
ratePartnerConsultancy : Joi.number() ,
assignedPerson : Joi.string().allow('') , 

}

const result = Joi.validate(req.body , schema)
if (result.error) return res.status(400).send({ error: result.error.details[0].message });

const newTask = new Task(partnerID,consultancyID , description,requiredSkills,payment,finalProduct,timeLine, lifeCycle , category , yearsOfExperience,
done , ratePartnerDoer , ratePartnerConsultancy , assignedPerson) ; 
tasks.push(newTask) 
return res.json({data:newTask}) ; 
}) ; 

router.put('/:taskID' , (req , res ) => { 
const taskID = req.params.taskID
const partnerID = req.body.partnerID
const consultancyID = req.body.consultancyID
const description = req.body.description 
const requiredSkills = req.body.requiredSkills
const payment =(Number) (req.body.payment)
const finalProduct = req.body.finalProduct
const timeLine = req.body.timeLine
const lifeCycle = req.body.lifeCycle
const category = req.body.category
const yearsOfExperience =(Number) (req.body.yearsOfExperience)
const done =req.body.done
const ratePartnerDoer =(Number) (req.body.ratePartnerDoer)
const ratePartnerConsultancy = (Number) (req.body.ratePartnerConsultancy)
const assignedPerson = req.body.assignedPerson
const schema = { 
partnerID : Joi.string() , 
consultancyID : Joi.string() , 
description : Joi.string() , 
requiredSkills : Joi.string(), 
payment : Joi.number() ,
finalProduct : Joi.string() , 
timeLine : Joi.string() , 
lifeCycle: Joi.string() , 
category : Joi.string() ,
yearsOfExperience : Joi.number(),
done : Joi.any() ,
ratePartnerDoer : Joi.number() ,
ratePartnerConsultancy : Joi.number() ,
assignedPerson : Joi.string().min(0) , 

}
const result = Joi.validate(req.body , schema)
if (result.error) return res.status(400).send({ error: result.error.details[0].message });

const task = tasks.find(x => x.taskID == taskID)
if (partnerID) task.partnerID = partnerID 
if (consultancyID) task.consultancyID = consultancyID 
if (description) task.Description = description 
if (requiredSkills) task.requiredSkills = requiredSkills 
if (payment) task.cost = payment 
if (finalProduct) task.finalProduct = finalProduct 
if (timeLine) task.timeLine = timeLine 
if (lifeCycle) task.lifeCycle = lifeCycle 
if (category) task.category = category 
if (typeof (done) != undefined) task.done = done 
if (ratePartnerDoer) task.ratePartnerDoer = ratePartnerDoer 
if (ratePartnerConsultancy) task.ratePartnerConsultancy = ratePartnerConsultancy 
if (yearsOfExperience) task.yearsOfExperience = yearsOfExperience 
if (assignedPerson) task.assignedPerson = assignedPerson 
res.json({data:tasks}) 

}) ; 

router.delete('/:taskID' , (req , res ) => {
const taskID = req.params.taskID
const task = tasks.find(x => x.taskID == taskID )
const index = tasks.indexOf(task)
tasks.splice(index,1) 
res.json({data : tasks})
}) ; 




// **searching for tasks**

//search by category
router.get('/search/category=:cat', async(req, res) => { 
const cat = req.params.cat
const tasks = await Task.find({"category":cat})
if(tasks.length==0)return res.status(404).send({error: 'no tasks found'})
return res.json({tasks});

});

//search by year of experience
router.get('/search/experience=:exp', async(req, res) => { 
const exp = req.params.exp
const tasks = await Task.find({"yearsOfExperience":exp})
if(tasks.length==0) return res.status(404).send({error: 'no tasks found'})
return res.json({tasks});

});

//search by monetary compensation *********************************************************************************************
router.get('/search/payment=:pay', async(req, res) => { 
const pay = req.params.pay
const min =Number(pay)-50
const max=Number(pay)+50
const tasks = await Task.find({"payment":{ $lte:max ,$gte:min} })
if(tasks.length==0) return res.status(404).send({error: 'no tasks found'})
return res.json({tasks});

});

//recommended tasks
router.get('/recommended/:id', async(req, res) => { 
const id = req.params.id
const user =await User.findById(id)
const userSkills = user.skills
const tasks = await Task.find({"requiredSkills":{$in:userSkills}})
if(tasks.length==0) return res.status(404).send({error: 'No tasks suitable for you at the moment, Try something new ?'})
return res.json({tasks});

}); 

module.exports = router ; 
