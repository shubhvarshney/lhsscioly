import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import userService from "../services/users";

const Verify = (props) => {
  const navigate = useNavigate();
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const token = query.get("token");

    const verify = async () => {
      try {
        await userService.verify(token);
        props.setNotif("Email verified successfully!");
        setTimeout(() => {
          props.setNotif(null);
        }, 5000);
      } catch (error) {
        if (
          error.response.data.error &&
          error.response.data.error === "Invalid or expired token"
        ) {
          props.setError("Invalid or expired verification token");
          setTimeout(() => {
            props.setError(null);
          }, 5000);
        }
      }
    };

    if (!token) {
      props.setError("No token provided");
      setTimeout(() => {
        props.setError(null);
      }, 5000);
    } else {
      verify();
    }
    navigate("/");
  }, []);
};

export default Verify;
