
async function submitOrderStatusForm(orderid){

    const details= document.querySelector('select[name="orderStatus"]').value
    

    const responses=await fetch(`/admin/orderData/${orderid}`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({status:details})
    })
    if(responses.status===200){
        Swal.fire({
            icon: 'success',
            title: 'Order Status Updated',
            text: 'The order status has been updated successfully.',
        });
        
    } else {
        // Handle error
        Swal.fire({
            icon: 'error',
            title: 'Error Updating Order Status',
            text: data.message || 'An error occurred while updating the order status.',
        });
    }

}

async function returnAccept(orderid){
    const details1 =document.getElementById('Accept')
    const details2 =document.getElementById('Reject')
    let validone = null
    if(details1.checked){
        validone = true
    }else if(details2.checked){
        validone = false
    }

    if(validone){
        const sented = await Swal.fire({
            title: 'Order Acceptence',
            text: "Are sure want Accept this Order",
            icon: 'success',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes'
        })
       console.log(sented);
        if(sented.isConfirmed){
            const result = await fetch(`/admin/returnRequest?id=${orderid}`)
            if(result.status === 203){
                Swal.fire(
                    'Accepted!',
                    'Your order returned is Accepted.',
                    'success'
                )
            }
        }
    }else{
        Swal.fire({
            icon: 'error',
            title: 'reject Order ',
            text: 'Order return is rejected.',
        })
    }

    
}

async function cancellAccept(orderid){
    const details1 =document.getElementById('accepted')
    const details2 =document.getElementById('rejected')
    let validone = null
    if(details1.checked){
        validone = details1.value
    }else if(details2.checked){
        validone = details2.value
    }

    if(validone){
        const sented = await Swal.fire({
            title: 'Order cancellation',
            text: "Are sure want Accept this Order Cancell",
            icon: 'success',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes'
        })
       console.log(sented);
        if(sented.isConfirmed){
            const result = await fetch(`/admin/cancellRequest?id=${orderid}`)
            if(result.status === 204){
                Swal.fire(
                    'Accepted!',
                    'Your order cacellation is Accepted.',
                    'success'
                )
            }
        }
    }else{
        Swal.fire({
            icon: 'error',
            title: 'reject Order ',
            text: 'Order return is rejected.',
        })
    }
}

