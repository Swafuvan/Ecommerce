 function razorpaymethod(order) {
    return {
        "key": "rzp_test_oQO9XJPXOTcdjc", // Enter the Key ID generated from the Dashboard
        "amount": order.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
        "currency": "INR",
        "name": "Acme Corp",
        "description": "Test Transaction",
        "image": "https://example.com/your_logo",
        "order_id":order.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
        "handler":async function (response) {
            const res = await fetch('/ordersuccess',{
                method:'POST',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify({response})
            })
            let orderdata= await res.json()
            if(res.status===200){
                location.href = `/confirmpage?id=${orderdata.order._id}`
            }

            // alert(response.razorpay_payment_id);
            // alert(response.razorpay_order_id);
            // alert(response.razorpay_signature)
           
        },
        "modal": {
            "ondismiss": function(){
                //  window.location.replace("//put your redirect URL");
             }
        },
        "prefill": {
            "name": "Gaurav Kumar",
            "email": "gaurav.kumar@example.com",
            "contact": "9000090000"
        },
        "notes": {
            "address": "Razorpay Corporate Office"
        },
        "theme": {
            "color": "#3399cc"
        }
    }

};


let razorpayfunction = function (order) {
    let options = razorpaymethod(order)
    var rzp1 = new Razorpay(options);
    rzp1.open();
    rzp1.on('payment.failed', function (response) {
        if(response.error.code){
            swal.fire(
                "Failed!",
                "Your Payment Failed",
                "error"
            )
        }
        
        
        // alert(response.error.code);
        // alert(response.error.description);
        // alert(response.error.source);
        // alert(response.error.step);
        // alert(response.error.reason);
        // alert(response.error.metadata.order_id);
        // alert(response.error.metadata.payment_id);
    });
}


