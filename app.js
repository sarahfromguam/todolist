//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

//*****MONGOOSE SCHEMAS + MODELS****//
mongoose.connect("mongodb+srv://admin-sarah:test123@cluster0.ogdgj.mongodb.net/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Schemas
const itemSchema = {
  name: String
}
const listSchema = {
  name: String,
  items: [itemSchema]
}

// Models
const Item = mongoose.model("Item", itemSchema);
const List = mongoose.model("List", listSchema);

// DEFAULT ITEMS //

// Instructions at Root Route
const default1 = new Item({
  name: "Welcome to your to do list!"
});

const default2 = new Item({
  name: "Press + to add an item."
});

const default3 = new Item({
  name: "<- Click that box to delete an item."
});

const default4 = new Item({
  name: "Create + access custom lists by going to /NameofCustomList"
});

const defaultItems = [default1, default2, default3, default4];

//*****GET ROUTES******//
// GET ROOT ROUTE
app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {
    if (foundItems.length == 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err)
        } else {
          console.log("Successfully added the items!")
        }
      });

    } else {
      if (err) {
        console.log(err)
      } else {
        res.render("list", {
          listTitle: "Today",
          newListItems: foundItems
        });
      }
    }
  });
});

// GET CUSTOM ROUTES
app.get("/:customListName", function(req, res){
  const customListName = _.capitalize([string=req.params.customListName]);

  List.findOne({name: customListName}, function(err, foundList){
    if (!err){
      if (!foundList){
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //Show an existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });

});

//*****POST ROUTES*****//
// POST TO ROOT ROUTE
app.post("/", function(req, res) {

  // add new items to the list
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName
  });

  if (listName === "Today"){
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      if (!err){
        foundList.items.push(newItem)
        foundList.save();
        res.redirect("/" + listName);
      }
    })
  }

});

// DELETE ROUTE //
app.post("/delete", function(req, res) {
  const delete_id = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today"){
    Item.findByIdAndRemove(delete_id, function(err) {
      if (err) {
        console.log(err)
      } else {
        console.log("Successfully removed.")
        res.redirect("/")
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: delete_id}}}, function(err, foundList){
      if (!err){
        res.redirect("/" + listName);
      }
        })
      }
    })



app.get("/about", function(req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started succesfully!");
});
