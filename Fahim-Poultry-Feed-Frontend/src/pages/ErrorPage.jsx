import React from "react";
import Lottie from "lottie-react";
import { useNavigate } from "react-router-dom";
import animationData from "../assets/error.json";

// MUI Imports
import { Box, Typography, Button } from "@mui/material";

export default function ErrorPage() {
  const navigate = useNavigate();
  return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(to bottom right, #fffbeb, #fef3c7, #fde68a)',
          p: 4,
          textAlign: 'center'
        }}
      >
        <Box sx={{ width: '100%', maxWidth: '450px' }}>
          <Lottie animationData={animationData} loop={true} />
        </Box>

        <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', mt: 4, color: 'grey.800' }}>
          Oops! Page Not Found
        </Typography>

        <Typography color="text.secondary" sx={{ mt: 1 }}>
          The page you are looking for does not exist or has been moved.
        </Typography>
        
        <Button
          onClick={() => navigate("/")}
          variant="contained"
          size="large"
          sx={{ mt: 4 }}
        >
          Go Home
        </Button>
      </Box>
  );
}