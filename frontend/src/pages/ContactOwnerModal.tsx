import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import { supabase } from '../utils/SupabaseClient';

interface ContactOwnerModalProps {
  open: boolean;
  onClose: () => void;
  listingId: string;
  listingTitle: string;
  listingImage?: string;
  pricePerWeek?: number;
  landlordName?: string;
}

export default function ContactOwnerModal({
  open,
  onClose,
  listingId,
  listingTitle,
  listingImage,
  pricePerWeek,
  landlordName
}: ContactOwnerModalProps) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [charCount, setCharCount] = useState(0);

  const minCharacters = 50;
  const maxCharacters = 1000;

  // Debug: Log when modal opens
  useEffect(() => {
    if (open) {
      console.log('🔵 ContactOwnerModal opened with props:', {
        listingId,
        listingTitle,
        listingImage,
        pricePerWeek,
        landlordName
      });
      
      // Check current auth state when modal opens
      checkAuthState();
    }
  }, [open, listingId]);

  // Function to check auth state
  const checkAuthState = async () => {
    try {
      console.log('🔍 Checking authentication state...');
      
      // Get session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('📋 Session:', session);
      console.log('📋 Session error:', sessionError);
      
      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 User:', user);
      console.log('👤 User ID:', user?.id);
      console.log('👤 User email:', user?.email);
      
      // Test the auth function
      console.log('🧪 Testing auth function...');
      const { data: authTest, error: authTestError } = await supabase.rpc('test_auth_uid');
      console.log('🧪 Auth test result:', authTest);
      console.log('🧪 Auth test error:', authTestError);
      
    } catch (err) {
      console.error('❌ Error checking auth state:', err);
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMessage = e.target.value;
    if (newMessage.length <= maxCharacters) {
      setMessage(newMessage);
      setCharCount(newMessage.length);
      setError(null);
    }
  };

  // In ContactOwnerModal.tsx, update the handleSubmit function:

const handleSubmit = async () => {
  console.log('🚀 Submit button clicked');
  
  // Validation
  if (message.trim().length < minCharacters) {
    setError(`Message must be at least ${minCharacters} characters long`);
    return;
  }

  setIsSubmitting(true);
  setError(null);

  try {
    // Get current user
    console.log('🔐 Getting current user...');
    const { data: { user } } = await supabase.auth.getUser();
    
    console.log('👤 Current user:', user);
    console.log('👤 User ID:', user?.id);
    console.log('👤 User email:', user?.email);
    
    if (!user) {
      console.error('❌ No user found');
      setError('You must be logged in to contact the owner');
      setIsSubmitting(false);
      return;
    }

    // Update params to include user_id
    const params = {
      p_listing_id: listingId,
      p_message: message.trim(),
      p_user_id: user.id,  // Add this line
      p_start_date: null,
      p_end_date: null,
      p_quoted_price: null
    };
    
    console.log('📤 Submitting inquiry with params:', params);

    // Submit inquiry
    const { data, error: submitError } = await supabase
      .rpc('submit_listing_inquiry', params);

    console.log('📥 RPC Response data:', data);
    console.log('📥 RPC Response error:', submitError);

    if (submitError) {
      console.error('❌ Error submitting inquiry:', submitError);
      setError(`Failed to send message: ${submitError.message}`);
      return;
    }

    // Success!
    console.log('✅ Inquiry submitted successfully!');
    setSuccess(true);
    
    // Reset form after a delay
    setTimeout(() => {
      setMessage('');
      setCharCount(0);
      setSuccess(false);
      onClose();
    }, 2000);

  } catch (err) {
    console.error('💥 Unexpected error:', err);
    setError('An unexpected error occurred. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};

  const handleClose = () => {
    if (!isSubmitting) {
      console.log('🔴 Modal closing');
      setMessage('');
      setCharCount(0);
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          position: 'relative'
        }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, pb: 1 }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
          Contact Owner
        </Typography>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          disabled={isSubmitting}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Listing Info */}
        <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {listingImage && (
              <Box
                component="img"
                src={listingImage}
                alt={listingTitle}
                sx={{
                  width: 80,
                  height: 60,
                  objectFit: 'cover',
                  borderRadius: 1
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            )}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                {listingTitle}
              </Typography>
              {pricePerWeek && (
                <Typography variant="body2" color="text.secondary">
                  ${pricePerWeek.toLocaleString()}/week
                </Typography>
              )}
              {landlordName && (
                <Typography variant="body2" color="text.secondary">
                  Owner: {landlordName}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        {/* Success Alert */}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Your message has been sent! The owner will be notified.
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Message Field */}
        <Box>
          <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
            Send a message to the owner about this listing
          </Typography>
          
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Hello, I'm interested in your listing. I would like to know more about..."
            value={message}
            onChange={handleMessageChange}
            error={!!error && !error.includes('logged in')}
            disabled={isSubmitting || success}
            sx={{
              '& .MuiOutlinedInput-root': {
                fontSize: '0.95rem',
              }
            }}
          />

          {/* Character Counter */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
            <Typography 
              variant="caption" 
              color={charCount < minCharacters ? 'error' : 'text.secondary'}
            >
              {charCount < minCharacters 
                ? `${minCharacters - charCount} more characters required`
                : `${charCount}/${maxCharacters} characters`
              }
            </Typography>
            
            {charCount >= minCharacters && (
              <Chip 
                label="Ready to send" 
                size="small" 
                color="success" 
                variant="outlined"
              />
            )}
          </Box>

          {/* Tips */}
          <Box sx={{ mt: 2, p: 2, bgcolor: '#f0f7ff', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              💡 Tips for a great message:
            </Typography>
            <Typography variant="body2" component="ul" sx={{ m: 0, pl: 2.5 }}>
              <li>Introduce yourself and your company</li>
              <li>Mention your intended use for the space</li>
              <li>Ask specific questions about availability or features</li>
              <li>Include your preferred rental dates if known</li>
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button 
          onClick={handleClose} 
          disabled={isSubmitting}
          sx={{ textTransform: 'none' }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="contained"
          disabled={isSubmitting || charCount < minCharacters || success}
          startIcon={isSubmitting ? <CircularProgress size={20} /> : <SendIcon />}
          sx={{ 
            textTransform: 'none',
            minWidth: 120
          }}
        >
          {isSubmitting ? 'Sending...' : 'Send Message'}
        </Button>
        // Add this somewhere visible in your component
<button onClick={async () => {
  console.log('=== AUTH TEST ===');
  const { data: { session } } = await supabase.auth.getSession();
  console.log('Session:', session);
  const { data: { user } } = await supabase.auth.getUser();
  console.log('User:', user);
  const { data: authTest, error } = await supabase.rpc('test_auth_uid');
  console.log('Auth test from DB:', authTest);
  console.log('Auth test error:', error);
}}>Test Auth</button>
      </DialogActions>
    </Dialog>
  );
}