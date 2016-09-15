$( document ).ready(function() {
    var offset = 400;
    $( window ).scroll(function() {
        if ($(this).scrollTop() > offset) {
            $('.back-to-top').fadeIn('slow');
        } else {
            $('.back-to-top').fadeOut('slow');
        }
    });
    $('.back-to-top').click(function(event) {
        event.preventDefault();
        $('html, body').animate({scrollTop: 0}, 500);
        return false;
    });
});