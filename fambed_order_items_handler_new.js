function get_size(item){
    var name = item.name.split(" ");
    for(index of name){
        if(index.match(/(\d{3})x(\d{3})/)){
            
            if(index.match(/(\d{3})x(\d{3})x(\d{1})/)){
                
                if(index.match(/(\d{3})x(\d{3})x(\d{1})cm/)){
                    index = index.replace("cm", "").split("x");
                    dimensions = {
                        "width": index[0],
                        "length": index[1],
                        "height": index[2]
                    };
                    return dimensions;
                }
                
                index = index.split("x");
                dimensions = {
                    "width": index[0],
                    "length": index[1],
                    "height": index[2]
                };
                return dimensions;
            }
            var height = 0;

            for(data of item.meta_data){
                if(data.key == "pa_hoejde"){
                    height = data.value.replace("cm", "");
                }
            }

            index = index.split("x");
            dimensions = {
                "width": index[0],
                "length": index[1],
                "height": height
            };
            
            return dimensions;
        }
    }
}

function get_color(item){
    var color = "none";
    for(data of item.meta_data){
        if(data.key == "pa_farve"){
            color = data.value;
            break;
        }
    }
    return color;
}

function get_expected_shipping_date(){

    var date = $input.first().json.date_created.split("T")[0];
    var dateYear = date.split("-")[0];
    var dateMonth = date.split("-")[1];
    var dateDay = date.split("-")[2];

    if(Number(dateDay) <= 15){
        var expected = "30" + "/" + dateMonth + "/" + dateYear;
      } else{
        if(Number(dateMonth) + 1 < 13){
          dateMonth = Number(dateMonth) + 1;
          var expected = "15" + "/" + dateMonth + "/" + dateYear;
        }else{
          dateYear = Number(dateYear) + 1;
          var expected = "15" + "/" + "01" + "/" + dateYear;
        }
      }
    return expected;
}

var colorCorrection = {
    "hvid": "White",
    "beige": "Beige",
    "graa": "Grey"
}

var expectedShippingDate = get_expected_shipping_date();

for (const item of $input.first().json.line_items) {

    item.specs = {};
    itemNameArray = item.name.split(" ");
    
    if(item.sku.match(/fambed_tm/)){

        if(!item.sku.match(/fambed_tm_special/)){

            item.specs.dimensions = get_size(item);
            item.specs.type = "Mattress topper";
            item.specs.comment = $input.first().json.customer_note;

        }


    }else if(item.sku.match(/fambed_sheet/)){

        if(!item.sku.match(/fambed_sheet_special/)){

            var dimensions = get_size(item);
            item.specs.dimensions = {
                "labelWidth": dimensions["width"],
                "labelLenght": dimensions["length"],
                "labelHeight": "30",
                "prodWidth": Math.round(dimensions["width"] * 1.03),
                "prodLength": Math.round(dimensions["length"] * 1.01),
                "prodHeight": Math.round(30 * 1.03)
            };

            item.specs.type = "-";
            item.specs.product = "Sheet with elastic band";
            item.specs.expectedShipment = get_expected_shipping_date();
            item.specs.color = colorCorrection[get_color(item)];
        }

    }else if(item.sku.match(/fambed_sk/)){

        if(!item.sku.match(/fambed_sk_special/)){

            var dimensions = get_size(item);
            item.specs.dimensions = {
                "labelWidth": dimensions["width"],
                "labelLenght": dimensions["length"],
                "labelHeight": dimensions["height"],
                "prodWidth": Math.round(dimensions["width"] * 1.01),
                "prodLength": Math.round(dimensions["length"] * 1.01),
                "prodHeight": Math.round(dimensions["height"] * 1.03)
            };
            
            // get style/type for bedskirt
            for(data of item.meta_data){
                if(data.key == "pa_sengekappe-stil"){
                    if(data.value == "boelget"){
                        item.specs.type = "Ruffled";
                    }else{
                        item.specs.type = "with inverted pleats";
                    }
                }
            }
            
            item.specs.color = colorCorrection[get_color(item)];
            item.specs.product = "Bedskirt";
            item.specs.expectedShipment = expectedShippingDate;
        
        }
        
    }else if(item.sku.match(/fambed_(\d{1,3}|special)/)){

        if(!item.sku.match(/fambed_special/)){

            item.specs.dimensions = get_size(item);


        }

    }

}

return $input.all();