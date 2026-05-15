$(document).ready(function () {
  options = {
      trigger_event: "click",
      color: {
          r: 0,
          g: 0,
          b: 0
      },
      onChange: function(colorHSB) {
          // do stuff with color
          // console.log(colorHSB.toRGB());
          // console.log(colorHSB.toHex());
          if(colorHSB.toHex()!="000000")
          {
            $("#status_color").val('#'+colorHSB.toHex());
          }
      }
  }
//  new ColorPicker($("#status_color"), options);
});
$(document).ready(function() {
  $(".member").hide();
  $(".new_review").hide();
  $(".customer_name").hide();
  $("#user_email").bind("change",function() {
      if ($(this).val() != undefined) {
          $.ajax({
              url : "/get_name",
              data: {'email': $(this).val()},
              dataType: "json",
              type: "GET",
              success : function(data) {
                  $(".member").hide();
                  $(".customer_name").show();
                  $('#customer_name').text(data["first_name"] + " " + data["last_name"]);
                  $("#member_first_name").prop('required',false);
                  $("#member_last_name").prop('required',false);
              },
              error : function() {
                $(".member").show();
                $(".customer_name").hide();
                $('#customer_name').text("");
                $("#member_first_name").prop('required',true);
                $("#member_last_name").prop('required',true);
              }
          })
      }
  })
  $("#write_review").click(function() {
    $(".new_review").show();
    $("#write_review").hide();
  });
  $("#cancel_review").click(function() {
    $(".new_review").hide();
    $("#write_review").show();
  });
})
$(document).ready(function(){
  $(function() {
    $('.datepicker').datepicker({format: 'yyyy-mm-dd'});
  });
});