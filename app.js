//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set('useFindAndModify', true);

const itemsSchema = {
  name: String,
};

const Item = mongoose.model("Item", itemsSchema);

 const item1 = new Item({
   name: " "
 });


const defaultItems = [item1];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {

  const day = date.getDate();

  //res.render("list", {listTitle: day, newListItems: items});

  Item.find({}, function(err, foundItems){
    if(foundItems.length === 0){
      Item.insertMany(defaultItems, function(err){
        if(err){
          console.log(err);
        }else{
          console.log("Successfully saved default items to DB.");
        }
      });
      res.redirect("/");
    }else{
      res.render("list", {date: day, listTitle: "To Do List", newListItems: foundItems});
    }

  });


});

app.get("/:customListName", function(req, res){
  const day = date.getDate();
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList){
    if(!err){
      if(!foundList){
        //create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else{
        //show an existing list
        res.render("list", {date: day, listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName === "To Do List"){
    item.save();
    res.redirect("/");
  } else{
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req, res){
  const checkedId = req.body.checked;
  const listName = req.body.listName;

  if(listName === "To Do List"){
    Item.findByIdAndDelete(checkedId, function(err){
      if(!err){
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedId}}}, function(err, foundList){
      if(!err){
        res.redirect("/" + listName);
      }
    })
  }
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started successfully");
});
