const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const app = express();
const models = require('./models/index');
const path = require('path');
const multer = require('multer');
const upload = multer({ dest: '/tmp/' });
var FileReader = require('filereader')
    , fileReader = new FileReader()
    ;
fs = require('fs');

//import SequelizeFile from 'sequelize-file';

// Decode json and x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '/views'));

process.env.CC_FS_BUCKET = '/:' + process.env.BUCKET_HOST;
app.use('/static', express.static('/'));

// Add a bit of logging
app.use(morgan('short'))

//Associations
models.Monkey.belongsTo(models.Enclos);
models.Enclos.hasMany(models.Monkey, { as: "Monkeys" });

app.get('/', function (req, res) {
    var tabTempMonkeys = [];
    var tabTempEnclos = [];

    models.Monkey.findAll()
        .then((monkeys) => {
            //console.log(monkeys)
            tabTempMonkeys = monkeys;
        })
    models.Enclos.findAll()
        .then((enclos) => {
            //console.log(enclos
            tabTempEnclos = enclos;
        })
        .then(() => {
            res.render('index', { tabMonkey: tabTempMonkeys, tabEnclos: tabTempEnclos });
        })
})

app.get('/AddMonkey', function (req, res) {
    res.render('AjouterSinge')
})
app.get('/AddEnclos', function (req, res) {
    res.render('AjouterEnclos')
})

app.get('/majSinge/:id', function (req, res) {
    res.render('majSinge', { id: req.params.id })
})

app.get('/majEnclos/:id', function (req, res) {
    res.render('majEnclos', { id: req.params.id })
})

app.get('/LierAEnclos/:id', function (req, res) {
    models.Enclos.findAll({ where: req.query })
        .then((enclos) => {
            res.render('lierAEnclos', { obj: enclos, id: req.params.id });
        })
})


app.post('/addImg/:id', upload.single('file'), function (req, res) {
    if (req.file != undefined) {
        let ext = req.file.originalname.substring(req.file.originalname.lastIndexOf('.'), req.file.originalname.length);
        let urlDestination = __dirname + "/images/" + req.params.id + ext;
        //var imageData = fs.readFileSync(req.file.path);
        //fs.writeFileSync("src/test/" + req.params.id + ".png", imageData);

        fs.rename(req.file.path, urlDestination, function (err) {
            if (err)
                console.log(err);
            else {
                models.Monkey.update({ urlPhoto: "/static/" + req.params.id + ext }, { where: { id: req.params.id } })
                    .then(() => {
                        res.render('SingeMisAJour');
                    })
            }
        })
    }
    else {
        models.Monkey.findOne({ where: { id: req.params.id } })
            .then((monkey) => {
                res.render('OneMonkey', { obj: monkey });
            })
    }
        
    
    //var imageData = fs.readFileSync(req.file.path);
    //fs.writeFileSync("test/" + req.params.id + ".png", imageData);

    //models.Monkey.update({ urlPhoto: "images/" + req.params.id + ".png", imageData}, { where: { id: req.params.id } })
    //    .then(() => {
    //        res.render('SingeMisAJour');
    //    })
})

app.get('/lier/:idSinge/:idEnclos', function (req, res) {
    models.Enclos.findOne({ where: { id: req.params.idEnclos} })
        .then((enclos) => {
            models.Monkey.findOne({ where: { id: req.params.idSinge } })
                .then((singe) => {
                    enclos.addMonkeys(singe).then(() => {
                        res.render('OneMonkey', { obj: singe })
                    })
                })
        })
})

// Monkeys--------------------------------------------------------------------------------------------------------------------------------

// CREATE -------------------------------------------
// POST UI
// CREATE ONE
app.post('/monkeys', function (req, res) {
    models.Monkey.create({
        name: req.body.name,
        age: req.body.age,
        espece: req.body.espece,
        nomEnclos: 'Sans enclos',
        urlPhoto: ""
    })
        .then(() => {
            res.render('SingeAjoute')
        })
})

// API
// CREATE ONE
app.post('/v1/monkeys', function (req, res) {
    models.Monkey.create({
        name: req.body.name,
        age: req.body.age,
        espece: req.body.espece,
        nomEnclos: 'Sans enclos'
    })
        .then(() => {
            res.send('Singe Ajoute')
        })
})

// READ ---------------------------------------------
// GET UI
// GET ONE
app.get('/monkeys/:id', function (req, res) {
    models.Monkey.findOne({ where: { id: req.params.id } })
        .then((monkey) => {
            res.render('OneMonkey', { obj: monkey });
        })
})

// GET FILTER
app.get('/monkeys', function (req, res) {
    models.Monkey.findAll({ where: req.query })
        .then((monkeys) => {
            res.render('AllMonkeys', { obj: monkeys });
        })
})

// API
// GET ALL
app.get('/v1/monkeys', function (req, res) {
    models.Monkey.findAll({ where: req.query })
        .then((monkeys) => {
            res.send(monkeys);
        })
})

// GET ONE BY ID
app.get('/v1/monkeys/:id', function (req, res) {
    models.Monkey.findOne({ where: { id: req.params.id } })
        .then((monkey) => {
            res.send(monkey);
        })
})

// UPDATE -------------------------------------------
// UPDATE ONE
function MiddleWareMAJ(req, res, next) {
    console.log(req.body);
    const objRet = req.body;
    for (let property in req.body) {
        if (req.body[property] == '') {
            delete objRet[property];
        }
    }
    console.log(objRet);
    req.body = objRet;
    next();
}

// UPDATE
// UPDATE UI
app.post('/update/monkeys/:id', [MiddleWareMAJ], function (req, res) {
    models.Monkey.update({ name: req.body.name, age: req.body.age, espece: req.body.espece }, { where: { id: req.params.id } })
        .then(() => {
            res.render('SingeMisAJour');
        })
})

// API
// UPDATE ONE BY ID
app.put('/v1/monkeys/:id', function (req, res) {
    models.Monkey.update({ name: req.body.name, age: req.body.age, espece: req.body.espece }, { where: { id: req.params.id } })
        .then(() => {
            res.send('Singe Mis A Jour');
        })
})

// UPDATE FILTER
app.put('/v1/monkeys', function (req, res) {
    models.Monkey.update({ name: req.body.name, age: req.body.age, espece: req.body.espece }, { where: req.query })
        .then(() => {
            res.send("Singe mis a jour")
        })
})

// DELETE -------------------------------------------
// DELETE UI
app.get('/delete/monkeys/:id', function (req, res) {
    models.Monkey.destroy({ where: { id: req.params.id } })
        .then(() => {
            res.render('SingeSupprime')
        })
})

// API
// DELETE ONE BY ID
app.delete('/v1/monkeys/:id', function (req, res) {
    models.Monkey.destroy({ where: { id: req.params.id } })
        .then(() => {
            res.send('Singe Supprimé')
        })
})

// DELETE FILTER
app.delete('/v1/monkeys', function (req, res) {
    models.Monkey.destroy({ where: req.query })
        .then(() => {
            res.send("Tous les singe correspondant aux critères ont été supprimés");
        })
})


// Enclos --------------------------------------------------------------------------------------------------------------------------------

// CREATE -------------------------------------------
// POST UI
app.post('/enclos', function (req, res) {
    models.Enclos.create({
        name: req.body.name,
        taille: req.body.taille,
        environnement: req.body.environnement
    })
        .then(() => {
            res.render('EnclosAjoute')
        })
})

// API POST
app.post('/v1/enclos', function (req, res) {
    models.Enclos.create({
        name: req.body.name,
        taille: req.body.taille,
        environnement: req.body.environnement
    })
        .then(() => {
            res.send('Enclos added')
        })
})

// READ ---------------------------------------------
// GET UI
// GET ONE
app.get('/enclos/:id', function (req, res) {
    models.Enclos.findOne({ where: { id: req.params.id } })
        .then((enclos) => {
            enclos.getMonkeys().then(associatedTasks => {
                res.render('OneEnclos', { obj: enclos, tabMonkey: associatedTasks });
            })
        })
})

// GET FILTER
app.get('/enclos', function (req, res) {
    var tabTempMonkeys = [];
    var tabTempEnclos = [];

    models.Monkey.findAll()
        .then((monkeys) => {
            //console.log(monkeys)
            tabTempMonkeys = monkeys;
        })
    models.Enclos.findAll()
        .then((enclos) => {
            //console.log(enclos
            tabTempEnclos = enclos;
        })
        .then(() => {
            res.render('AllEnclos', { tabMonkey: tabTempMonkeys, tabEnclos: tabTempEnclos });
        })
})

// API
// GET ONE
app.get('/v1/enclos/:id', function (req, res) {
    models.Enclos.findOne({ where: { id: req.params.id } })
        .then((enclos) => {
            res.send(enclos)
        })
})

// GET FILTER
app.get('/v1/enclos', function (req, res) {
    models.Enclos.findAll({ where: req.query })
        .then((enclos) => {
            res.send(enclos);
        })
})

// UPDATE -------------------------------------------
// PUT UI
app.post('/update/enclos/:id', [MiddleWareMAJ], function (req, res) {
    models.Enclos.update({ name: req.body.name, taille: req.body.taille, environnement: req.body.environnement }, { where: { id: req.params.id } })
        .then(() => {
            res.render('EnclosMisAJour');
        })
})

// API
// UPDATE ONE
app.put('/v1/enclos/:id', function (req, res) {
    models.Enclos.update({ name: req.body.name, taille: req.body.taille, environnement: req.body.environnement }, { where: { id: req.params.id } })
        .then(() => {
            res.send("Enclos mis a jour")
        })
})

//UPDATE FILTER
app.put('/v1/enclos', function (req, res) {
    models.Enclos.update({ name: req.body.name, taille: req.body.taille, environnement: req.body.environnement }, { where: req.query })
        .then(() => {
            res.send("Plusieurs enclos mis a jour")
        })
})

// DELETE -------------------------------------------
// DELETE UI
app.get('/delete/enclos/:id', function (req, res) {
    models.Enclos.destroy({ where: { id: req.params.id } })
        .then(() => {
            res.render('enclosSupprime')
        })
})
// API
// DELETE ONE
app.delete('/v1/enclos/:id', function (req, res) {
    models.Enclos.destroy({ where: { id: req.params.id } })
        .then(() => {
            res.send("Enclos supprimé")
        })
})

// DELETE FILTER
app.delete('/v1/enclos', function (req, res) {
    models.Enclos.destroy({ where: req.query })
        .then(() => {
            res.send("Tous les enclos correspondant aux critères ont été supprimés");
        })
})


// Synchronize models
models.sequelize.sync().then(function() {
  /**
   * Listen on provided port, on all network interfaces.
   * 
   * Listen only when database connection is sucessfull
   */
  app.listen(process.env.PORT, function() {
    console.log('Express server listening on port 3000');
  });
});
