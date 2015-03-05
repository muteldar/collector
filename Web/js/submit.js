$("document").ready(function() {
  var form = $('#email-form');
  var div = $('.bumpdiv');
  form.submit(function(event) {
    form.find('button').prop('disabled', true);
    var email = $('#email').val();
    if(email != '')
    {
      $.ajax({
        url: '/process.php',
        type: 'POST',
        data: { email : email },
        success: function(output){
          switch (output) {
            case "0":
              div.empty();
              div.append('<h2 style="color: red;">Please provide a valid email!</h2>');
              form.find('button').prop('disabled', false);
              break;
            case "1":
              div.empty();
              div.append('<h2>Thanks for your Submit!</h2>');
              form.find('button').prop('disabled', false);
              break;
            case "2":
              div.empty();
              div.append('<h2 style="color: red;">Email already submitted thanks!</h2>');
              form.find('button').prop('disabled', false);
              break;
            default:
              div.empty();
              div.append('<h2 style="color: red;">Unknown issue try again later :(</h2>');
              form.find('button').prop('disabled', false);
              break;
          }
        },
        error: function(e){
          console.log(e);
        }
      });
    }
    else
    {
      div.empty();
      div.append('<h2 style="color: red;">Please enter your E-Mail</h2>');
      form.find('button').prop('disabled', false);
    }
    return false;
  });
});
