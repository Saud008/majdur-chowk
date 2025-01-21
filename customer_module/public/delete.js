document.addEventListener("click", function (event) {
  if (event.target.classList.contains("deleteLink")) {
    event.preventDefault();

    const result = confirm("Are you sure you want to delete?");

    if (result) {
      const recordId = event.target.getAttribute("data-record-id");
      const deleteUrl = "/delete/" + recordId;

      fetch(deleteUrl, {
        method: "DELETE",
      })
        .then((response) => {
          if (response.status === 204) {
            window.location.href = "/services";
          } else {
            alert("Oops! Can't delete the record.Please try again.");
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }
});
