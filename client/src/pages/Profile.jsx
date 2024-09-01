import { useSelector } from "react-redux";
import { useEffect, useRef, useState } from "react";
import { Link } from 'react-router-dom'
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { app } from "../firebase";
import {
  updateUserStart,
  updateUserFailure,
  updateUserSuccess,
  deleteUserFailure,
  deleteUserStart,
  deleteUserSuccess,
} from "../redux/user/userSlice.js";
import { useDispatch } from "react-redux";

export default function Profile() {
  const fileRef = useRef(null);

  const dispatch = useDispatch();

  const { currentUser, loading, error } = useSelector((state) => state.user);
  const [file, setFile] = useState(undefined);
  const [filePercentage, setFilePercentage] = useState(undefined);
  const [fileUploadError, setFileUploadError] = useState(false);
  const [formData, setFormData] = useState({});
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [showListingError, setShowListingError] = useState(false)
  const [userListings, setUserListings] = useState([])

  useEffect(() => {
    if (file) {
      handleFileUpload(file);
    }
  }, [file]);

  const handleDeleteUser = async () => {
    try {
      dispatch(deleteUserStart());
      const res = await fetch(`/api/user/delete/${currentUser._id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success === false) {
        dispatch(deleteUserFailure(data.message));
        return;
      }
      dispatch(deleteUserSuccess(data));
    } catch (error) {
      dispatch(deleteUserFailure(error.message));
    }
  };

  const handleFileUpload = (file) => {
    const storage = getStorage(app);
    const fileName = new Date().getTime() + file.name;

    const storageRef = ref(storage, fileName);

    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setFilePercentage(Math.round(progress));
      },
      (error) => {
        setFileUploadError(true);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setFormData({ ...formData, avatar: downloadURL });
        });
      }
    );
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      dispatch(updateUserStart());
      const res = await fetch(`/api/user/update/${currentUser._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success === false) {
        dispatch(updateUserFailure(data.message));
        return;
      }

      dispatch(updateUserSuccess(data));
      setUpdateSuccess(true);
    } catch (error) {
      dispatch(updateUserFailure(error.message));
    }
  };

  const handleSignOut = async () => {
    try {
      const res = await fetch("/api/auth/signout");
      const data = await res.json();

      if (data.success === false) {
        dispatch(deleteUserFailure(data.message));
        return;
      }
      dispatch(deleteUserSuccess(data));
    } catch (error) {
      dispatch(deleteUserFailure(data.message));
    }
  };

  const handleShowListings = async()=> {
      try {
        setShowListingError(false)
        const res = await fetch(`/api/user/listings/${currentUser._id}`);
        const data = await res.json()

        if(data.success === false){
          setShowListingError(true)
          return;
        }
        setUserListings(data)
      } catch (error) {
        setShowListingError(true)
      }
  }

  const handleListingDelete = async (listingId) => { 
    try {
      const res = await fetch(`/api/listing/delete/${listingId}`,{
        method: 'DELETE'
      });
      const data = await res.json()

      if(data.success === false){
        console.log(data.message);
        return;
      }

      setUserListings((prev) => prev.filter((listing) => listing._id !== listingId))
    } catch (error) {
      console.log(error.message)
    }
  }

  return (
    <div className="p-3 max-w-lg mx-auto">
      <h1 className="text-3xl font-semibold text-center my-7">Profile</h1>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <input
          hidden
          onChange={(e) => setFile(e.target.files[0])}
          accept="image/*"
          type="file"
          name=""
          id=""
          ref={fileRef}
        />
        <img
          onClick={() => fileRef.current.click()}
          src={formData?.avatar || currentUser.avatar}
          alt="profilePicture"
          className="rounded-full h-24 w-24 object-cover cursor-pointer self-center mt-2"
        />
        <p className="text-sm self-center">
          {fileUploadError ? (
            <span className="text-red-700">Error uploading Image</span>
          ) : filePercentage > 0 && filePercentage < 100 ? (
            <span className="text-yellow-400">
              {" "}
              {`Uploading ${filePercentage} %`}
            </span>
          ) : filePercentage === 100 ? (
            <span className="text-green-600">Image SuccessFully Uploaded</span>
          ) : (
            " "
          )}
        </p>
        <input
          type="text"
          name=""
          placeholder="username"
          defaultValue={currentUser.username}
          className="border p-3 rounded-lg"
          id="username"
          onChange={handleChange}
        />
        <input
          type="email"
          name=""
          placeholder="email"
          defaultValue={currentUser.email}
          className="border p-3 rounded-lg"
          id="email"
          onChange={handleChange}
        />
        <input
          type="text"
          name=""
          onChange={handleChange}
          placeholder="password"
          className="border p-3 rounded-lg"
          id="password"
        />

        <button
          disabled={loading}
          className="bg-slate-700 text-white rounded-lg p-3 uppercase hover:opacity-95 disabled:opacity-80"
        >
          {loading ? "Loading..." : "Update"}
        </button>

        <Link className="bg-green-700 text-white p-3 rounded-lg uppercase text-center hover:opacity-95" to={"/create-listing"}>Create Listing</Link>
      </form>
      <div className="flex justify-between mt-5">
        <span
          onClick={handleDeleteUser}
          className="text-red-700 cursor-pointer"
        >
          Delete Account
        </span>
        <span onClick={handleSignOut} className="text-red-700 cursor-pointer">
          Sign Out
        </span>
      </div>

      <p className="text-red-700 mt-5"> {error ? error : " "} </p>
      <p className="text-green-700 mt-5">
        {" "}
        {updateSuccess ? "User is updated successfully " : " "}{" "}
      </p>
      <button onClick={handleShowListings} className="text-green-700 w-full">Show Listings</button>
    <p className="text-red-700 mt-5"> {showListingError ? 'Error Showing Listings' : ''} </p>

    { userListings && userListings.length > 0 &&
       <div className="flex flex-col gap-4">
        <h1 className="text-center mt-7 text-2xl font-semibold">Your Listings</h1>
       { userListings.map((listings)=>(
         <div key={listings._id} className="gap-4 border rounded-lg p-3 flex justify-between items-center">
          <Link to={`/listing/${listings._id}`}>
            <img className="h-16 w-16 object-contain " src={listings.imageUrls[0]} alt="listing cover" />
          </Link>
           <Link className="text-slate-700 font-semibold flex-1 hover:underline truncate" to={`/listing/${listings._id}`}>
            <p>
              {listings.name}
            </p>
           </Link>
           <div className="flex flex-col items-center">
             <button onClick={() => handleListingDelete(listings._id)} className="text-red-700 uppercase">Delete</button>
             <button className="text-green-700 uppercase">Edit</button>
           </div>
         </div>
       ))}
       </div>
    }
    </div>
  );
}
