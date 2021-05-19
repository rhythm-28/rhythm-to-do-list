const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');

// as data was getting lost on restarting the server, we started storing data on a database
const mongoose = require("mongoose");

const app = express();

// will set the view as ejs using express
app.set("view engine","ejs");

app.use(bodyParser.urlencoded({extended:true}));

app.use(express.static("public"));

// creating and connecting to database
// hiding url for security reasons

// creating a schema for a collection
const a = mongoose.Schema({
  name: String
});

// creating a collection
const b = mongoose.model("Item",a);

// creating documents
const c = new b({
  name: "Welcome to your to do list"
});

const d = new b({
  name: "Hit + to add a new item"
});

const e = new b({
  name: "<- Check this box to delete an item"
});

//inserting the documents created above inside the an array
const defaultItems = [c,d,e];

app.get("/", (req,res) =>
{
  // getting data from the database
  b.find(function(err,results){

    // if no document is present, its the first time the website is loaded
    if(results.length === 0)
    {
      b.insertMany(defaultItems,function(err){
        if(err)
         {
           console.log(err);
         }
         else
         {
           console.log("successfully done");
         }
      });

      // as results is a copy of collection
      // we updated the database and not this copy
      // thus redirecting so that find will copy new content also in the results array
      res.redirect("/");
    }

    // data to be sent to browser
    // for markers placed in ejs file
    else
    {
      res.render("index", { todayMarker : "Today", itemMarker : results} );
    }
  });

});

// creating a schema for custom lists
const x = mongoose.Schema({
  listName: String,

  //embedding the item schema
  // aray of items
  tasks: [a]
});

// creating a collection
// this collection will store documents which are custom Lists
// these documents consist of a a name and an array of items
const y = mongoose.model("List",x);

// when user enters wants to create a new custom list
// or when he wants to access an existing custom list
// using Express Routing Parameters
app.get("/:pageName", (req,res) => {

  const desiredListName = req.params.pageName;

  // checking if the list that user wants, exists or not
  y.findOne( { listName: desiredListName}, function(err,desiredList) {
    if(err)
    {
      console.log(err);
    }
    else
    {
      // desiredist is NILL
      // that means the list doesn't exist
      // i.e, the user wants to create a new list
      if(!desiredList)
      {
        // creating a custom list, which is actually a document inside the collection Lists
        const z = new y ({
          listName : desiredListName,
          tasks: [c,d,e]
        });

        z.save();

        // list is created but the desiredList is currently NILL
        // so cant use it for rendering
        // so redirecting will cause control to go in the else statement below
        res.redirect("/" + desiredListName);
      }

      // list already exists
      // so render it on screen
      else
      {
        res.render("index", { todayMarker : desiredList.listName , itemMarker : desiredList.tasks} );
      }
    }
  });
});

app.get("/about", (req,res) =>
{
  res.render("about");
}
);

app.post("/", (req,res) =>
{
  let item = req.body.newItem ;
  let listNameButton = req.body.button;

  // creating a new document inside database which stores the new to do list item added by user
  const c = new b({
    name: item
  });


  // if the list in which user added a new item was the Today list
  if(listNameButton === "Today")
  {
    c.save();
    res.redirect("/");
  }

  // if the list in which user added a new item was a custom list
  else
  {
    y.findOne( {listName: listNameButton}, function(err,foundList){
      if(err)
      {
        console.log(err);
      }
      else
      {
        if(!foundList)
        {
          console.log("nhi mili");
        }
        else
        {
          // adding the new item to the custom list

          foundList.tasks.push(c);
          foundList.save();
          res.redirect("/" + listNameButton);
        }
      }
    });
  }
});

app.post("/delete",function(req,res){
  const itemId = req.body.deleteItem;
  const listNameDelete = req.body.listName;

  // if the list is today list
  if(listNameDelete === "Today")
  {
    b.findByIdAndRemove(itemId,function(err){
      if(err)
         {
           console.log(err);
         }
         else
         {
           res.redirect("/");
         }
    });
  }

  // if the element to be deleted is from a custom list
  else
  {
    // finding the cutsom list and deleting the element from it
    y.findOneAndUpdate({
        listName : listNameDelete
      },
      {
        // alternative idea: use forEach loop to find the matching id and then deleting it
        $pull :{
          tasks:
          {
            _id : itemId
          }
        }
      },
      function(err,results){
        if(err)
        {
          console.log(err);
        }
        else
        {
          res.redirect("/" + listNameDelete);
        }
      });
  }
});

app.listen(process.env.PORT || 3000, () =>
{
  console.log("server running at port: 3000");
});
