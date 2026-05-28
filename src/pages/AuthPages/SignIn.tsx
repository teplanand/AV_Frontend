import { useState } from "react";
import { useLoginMutation } from "../../redux/api/login";
import { toast } from "react-toastify";
import { useNavigate } from "react-router";
import {
  Box,
  TextField,
  Typography,
  Fade,
  Button,
  Container,
  FormControlLabel,
  Checkbox,
  Link,
  keyframes,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { setToken as setTokenV2 } from "../../utils/auth";
import { useDispatch } from "react-redux";
import { setToken } from "../../redux/authSlice";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import logo from "../../assets/logo1.png";
import signinLeftImage from "../../assets/singin.png";

// --- ANIMATIONS ---

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
  100% { transform: translateY(0px); }
`;

const floatReverse = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(20px); }
  100% { transform: translateY(0px); }
`;

export default function SignIn() {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [login, { isLoading: isLoggingIn }] = useLoginMutation();

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogin = async () => {
    if (!employeeId || !password) {
      toast.error("Please enter Employee ID and password");
      return;
    }

    try {
      const response = await login({
        employee_id: employeeId,
        password: password,
      }).unwrap();

      const token = response.token || response.access_token;

      if (token) {
        setTokenV2(token);
        dispatch(setToken(token));

        if (response.permissions) {
          localStorage.setItem(
            "permissions",
            JSON.stringify(response.permissions),
          );
        } else {
          localStorage.removeItem("permissions");
        }

        toast.success("Login successful!");
        navigate("/apps");
      } else {
        toast.error("Login failed: No token received");
      }
    } catch (error: any) {
      console.error("Login Error:", error);
      toast.error(
        error?.data?.detail || error?.data?.message || "Login failed",
      );
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevents form from refreshing the page
      handleLogin();
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        width: "100%",
        overflow: "hidden",
        bgcolor: "background.default",
      }}
    >
      {/* Left Panel - Image Placeholder Section */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          width: "50%",
          position: "relative",
          alignItems: "center",
          justifyContent: "center",
          background: (theme) =>
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)"
              : "linear-gradient(135deg, #FFF5F2 0%, #FFE4D6 100%)",
          overflow: "hidden",
        }}
      >
        {/* Animated Background Elements */}
        <Box
          sx={{
            position: "absolute",
            top: "10%",
            left: "10%",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(243, 116, 64, 0.2) 0%, transparent 70%)",
            filter: "blur(50px)",
            animation: `${float} 10s ease-in-out infinite`,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: "10%",
            right: "10%",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(55, 130, 242, 0.15) 0%, transparent 70%)",
            filter: "blur(60px)",
            animation: `${floatReverse} 12s ease-in-out infinite`,
          }}
        />

        {/* Main Image */}
        <Box
          component="img"
          src={signinLeftImage}
          alt="Sign In Visual"
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: 2,
          }}
        />
      </Box>

      {/* Right Panel - Form Section */}
      <Box
        sx={{
          width: { xs: "100%", md: "50%" },
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          p: 4,
          background: (theme) =>
            theme.palette.mode === "dark"
              ? theme.palette.background.default
              : "#fff",
        }}
      >
        <Container maxWidth="xs" sx={{ textAlign: "center" }}>
          {/* Logo */}
          <Box sx={{ mb: 4, display: "flex", justifyContent: "center" }}>
            <Box
              component="img"
              src={logo}
              alt="Logo"
              sx={{
                height: 50,
                filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.1))",
              }}
            />
          </Box>

          {/* Heading */}
          <Box sx={{ mb: 5 }}>
            <Typography
              variant="h4"
              fontWeight={800}
              gutterBottom
              sx={{ color: "text.primary" }}
            >
              Welcome Back
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Sign in to continue to Hi-Lab
            </Typography>
          </Box>

          {/* Form Content */}
          <Box sx={{ width: "100%" }}>
            <Fade in={true}>
              <Box
                component="form"
                onKeyPress={handleKeyPress}
                onSubmit={(e) => e.preventDefault()}
                sx={{ textAlign: "left" }}
              >
                <Typography
                  variant="subtitle2"
                  fontWeight={600}
                  sx={{ mb: 1, ml: 0.5 }}
                >
                  Employee ID
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Enter your Employee ID"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  margin="none"
                  autoFocus
                  sx={{
                    mb: 3,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "4px",
                      backgroundColor: (theme) =>
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.03)"
                          : "#f9fafb",
                    },
                  }}
                />

                <Typography
                  variant="subtitle2"
                  fontWeight={600}
                  sx={{ mb: 1, ml: 0.5 }}
                >
                  Password
                </Typography>
                <TextField
                  fullWidth
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  margin="none"
                  sx={{
                    mb: 2,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "4px",
                      backgroundColor: (theme) =>
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.03)"
                          : "#f9fafb",
                    },
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 4,
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        size="small"
                        sx={{ color: "primary.main" }}
                      />
                    }
                    label={
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        fontWeight={500}
                      >
                        Remember me
                      </Typography>
                    }
                  />
                  <Link
                    component="button"
                    variant="body2"
                    onClick={() => navigate("/forgot-password")}
                    sx={{
                      fontWeight: 600,
                      textDecoration: "none",
                      color: "primary.main",
                    }}
                  >
                    Forgot Password?
                  </Link>
                </Box>

                <Button
                  fullWidth
                  size="large"
                  variant="contained"
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  sx={{
                    py: 1.8,
                    borderRadius: "4px",
                    fontWeight: 700,
                    fontSize: "1rem",
                    boxShadow: "0 10px 30px rgba(243, 116, 64, 0.3)",
                    background:
                      "linear-gradient(135deg, #F37440 0%, #B84A1C 100%)",
                    "&:hover": {
                      background:
                        "linear-gradient(135deg, #FF8A50 0%, #D85A2C 100%)",
                      transform: "translateY(-2px)",
                      boxShadow: "0 12px 35px rgba(243, 116, 64, 0.4)",
                    },
                    transition: "all 0.3s ease",
                  }}
                >
                  {isLoggingIn ? "Signing in..." : "Sign In"}
                </Button>
              </Box>
            </Fade>

            <Box mt={5} textAlign="center">
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ opacity: 0.7 }}
              >
                © {new Date().getFullYear()} Hi-Lab. All rights reserved.
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
