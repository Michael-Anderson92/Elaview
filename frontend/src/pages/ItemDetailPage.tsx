import { Box, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material'
import { Link, useParams } from 'react-router-dom';
import './styles/ItemDetailPage.css'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { CalendarToday } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import BrokenImageIcon from '@mui/icons-material/BrokenImage';
import People from '@mui/icons-material/People';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import WarningIcon from '@mui/icons-material/Warning';
import ContactOwnerModal from './ContactOwnerModal'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BlockIcon from '@mui/icons-material/Block';
import React from 'react';
import Rating from '@mui/material/Rating';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import { supabase } from '../utils/SupabaseClient';
import { handleImageError, FALLBACK_IMAGE_LARGE } from '../utils/imageFallback';

// Interface matching your database structure
interface Listing {
  id: string;
  landlord_id: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  width_ft?: number;
  height_ft?: number;
  area_sqft?: number;
  price_per_day?: number;
  price_per_week?: number;
  price_per_month?: number;
  security_deposit?: number;
  available_from?: string;
  available_until?: string;
  minimum_rental_days?: number;
  maximum_rental_days?: number;
  primary_image_url?: string;
  image_urls?: string[];
  video_url?: string;
  document_urls?: string[];
  features?: string[];
  visibility_rating?: number;
  traffic_count_daily?: number;
  allows_digital?: boolean;
  allows_physical?: boolean;
  content_restrictions?: string[];
  slug?: string;
  tags?: string[];
  view_count?: number;
  inquiry_count?: number;
  booking_count?: number;
  average_rating?: number;
  created_at?: string;
  updated_at?: string;
  published_at?: string;
  expires_at?: string;
  landlord_name?: string;
  landlord_verified?: boolean;
  rating?: number;
  coordinates?: any;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();

  // State management
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [value, setValue] = useState(0);
  const [value1, _] = React.useState<number | null>(4.7);
  const [startDate, setstartDate] = useState<Date | null>(null);
  const [endDate, setendDate] = useState<Date | null>(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  // Fetch listing data
  useEffect(() => {
    const fetchListing = async () => {
      if (!id) {
        setError('No listing ID provided');
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 Fetching listing with ID:', id);

        // Fetch from public_listings view to get landlord info
        const { data, error: fetchError } = await supabase
          .from('public_listings')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError) {
          console.error('❌ Error fetching listing:', fetchError);
          if (fetchError.code === 'PGRST116') {
            setError('Listing not found');
          } else {
            setError(`Failed to load listing: ${fetchError.message}`);
          }
          return;
        }

        if (!data) {
          setError('Listing not found');
          return;
        }

        console.log('✅ Listing fetched:', data);
        setListing(data);

        // Increment view count
        const { error: viewError } = await supabase
          .from('rental_listings')
          .update({
            view_count: (data.view_count || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);

        if (viewError) {
          console.warn('⚠️ Failed to update view count:', viewError);
        }

      } catch (err) {
        console.error('💥 Unexpected error:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  // Helper functions
  const formatPrice = (price?: number): string => {
    return price ? `$${price.toLocaleString()}` : '$0';
  };

  const formatTraffic = (count?: number): string => {
    if (!count) return 'Not specified';
    if (count >= 20000) return '20,000+ daily';
    if (count >= 15000) return '15,000+ daily';
    if (count >= 10000) return '10,000+ daily';
    if (count >= 5000) return '5,000+ daily';
    return `${Math.floor(count / 500) * 500}+ daily`;
  };

  const formatAvailability = (date?: string): string => {
    if (!date) return 'Immediately';
    const availableDate = new Date(date);
    const today = new Date();
    if (availableDate <= today) return 'Immediately';
    return availableDate.toLocaleDateString();
  };

  const getDisplayAddress = (listing: Listing): string => {
    if (listing.address_line1) {
      return listing.address_line1;
    }
    return listing.title || 'Address not specified';
  };

  // Loading state
  if (loading) {
    return (
      <Box sx={{ marginTop: '4em', padding: '2em' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }}></div>
            <p>Loading listing details...</p>
          </div>
        </div>
      </Box>
    );
  }

  // Error state
  if (error || !listing) {
    return (
      <Box sx={{ marginTop: '4em', padding: '2em' }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h2>Listing Not Found</h2>
          <p>{error || 'The listing you\'re looking for doesn\'t exist or has been removed.'}</p>
          <div style={{ marginTop: '20px' }}>
            <Link
              to="/browse"
              style={{
                padding: '12px 24px',
                backgroundColor: '#1976d2',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '4px',
                display: 'inline-block'
              }}
            >
              ← Back to Browse
            </Link>
          </div>
        </div>
      </Box>
    );
  }

  // Features for display
  const displayFeatures = listing.features && listing.features.length > 0
    ? listing.features
    : [
      "High visibility location",
      "Professional installation available",
      "Weather-resistant surface"
    ];

  // Split features into two columns
  const midpoint = Math.ceil(displayFeatures.length / 2);
  const featuresCol1 = displayFeatures.slice(0, midpoint);
  const featuresCol2 = displayFeatures.slice(midpoint);

  // Specification data
  const specData = [
    { icon: <LocalOfferIcon />, label: 'Type', value: listing.type || 'Not specified' },
    {
      icon: <i className="bi bi-arrows-angle-contract"></i>,
      label: 'Dimensions',
      value: listing.width_ft && listing.height_ft
        ? `${listing.width_ft}ft x ${listing.height_ft}ft`
        : 'Not specified'
    },
    { icon: <People />, label: 'Traffic', value: formatTraffic(listing.traffic_count_daily) },
    { icon: <i className="bi bi-type"></i>, label: 'Material', value: 'Weather-resistant' },
    {
      icon: <WarningIcon />,
      label: 'Restrictions',
      value: listing.content_restrictions?.join(', ') || 'Standard content guidelines apply'
    },
    {
      icon: <CalendarTodayIcon />,
      label: 'Min. Booking',
      value: listing.minimum_rental_days
        ? `${listing.minimum_rental_days} day${listing.minimum_rental_days > 1 ? 's' : ''}`
        : '1 day'
    },
    { icon: <i className="bi bi-download"></i>, label: 'Installation', value: 'Available' },
    { icon: <BlockIcon />, label: 'Permit Required', value: 'Contact owner' },
  ];

  // Mock review data (you can replace with real reviews from database later)
  const reviews = [
    {
      name: 'Sarah Johnson',
      company: 'Digital Brands Co.',
      rating: 5,
      date: 'December 2024',
      comment: 'Excellent location with high foot traffic. Professional service and great visibility for our campaign.'
    },
    {
      name: 'Mike Chen',
      company: 'Local Restaurant',
      rating: 4,
      date: 'November 2024',
      comment: 'Good visibility and responsive landlord. Installation went smoothly.'
    },
    {
      name: 'Emma Wilson',
      company: 'Fashion Startup',
      rating: 5,
      date: 'October 2024',
      comment: 'Perfect spot for our brand launch! Highly recommend this space.'
    }
  ];

  return (
    <Box sx={{ marginTop: '2em' }}>
      <div>

        {/* Top navigation */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '2em',alignItems:'center' }}>
          <Link to="/browse" style={{ textDecoration: "none", color: "#1E2A47", fontSize: 'calc(0.8rem + 0.2vw)' }}>
            ← Back to Listings
          </Link>

          <Box sx={{ display: 'flex' }}>
            <button className='icons'><i className="bi bi-share"></i></button>
            <button className='icons'><i className="bi bi-heart"></i></button>
          </Box>
        </Box>


        <Box className='layout1'>
          <Box className='mainContent'>
            <Box sx={{ fontSize: 'calc(1.2em + 0.2vw)', fontWeight: 'bold' }}>
              {listing.title}
            </Box>

            <Box sx={{ fontSize: 'calc(0.8em + 0.2vw)', display: 'flex', gap: '0.5em', color: '#666', fontWeight: 500, alignItems: 'center' }}>
              <i className="bi bi-geo-alt"></i>
              <Box>{getDisplayAddress(listing)}</Box>
              <Box sx={{ fontSize: 'calc(0.6em + 0.2vw)', color: 'black', fontWeight: 500, border: '1px solid grey', padding: '0.3em', borderRadius: '1em' }}>
                {listing.city || 'NYC'}
              </Box>
            </Box>

            {/* Updated image container with fallback */}
            <Box sx={{ width: '100%', marginTop: '1em' }}>
              <div className="main-image-container">
              <img 
                src={listing.primary_image_url || FALLBACK_IMAGE_LARGE} 
                alt={listing.title}
                onError={(e) => handleImageError(e, 'large')}
              />
              </div>

              {/* Additional Images with fallback */}
              <div className="additional-images-container">
                {listing.image_urls && listing.image_urls.length > 0 ? (
                  listing.image_urls.slice(0, 4).map((imageUrl, index) => (
                    <Box key={index} sx={{ flex: 1, height: 100, borderRadius: '4px', overflow: 'hidden' }}>
                      <img
                        src={imageUrl}
                        alt={`${listing.title} ${index + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => handleImageError(e, 'small')}
                      />
                    </Box>
                  ))
                ) : (
                  // Placeholder images if no additional images
                  [1, 2, 3, 4].map((item) => (
                    <Box key={item} sx={{ flex: 1, height: 100, backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}>
                      <BrokenImageIcon sx={{ color: '#ccc' }} />
                    </Box>
                  ))
                )}
              </div>
            </Box>

            {/* Tabs Section */}
            <Box className='sections'>
              <Tabs value={value} onChange={handleChange} aria-label="listing details tabs" variant="fullWidth"
                sx={{
                  '& .MuiTabs-indicator': { display: 'none' },
                  '& .MuiTab-root': {
                    color: '#666',
                    textTransform: 'capitalize',
                    fontFamily: 'inherit',
                    fontWeight: 600,
                    fontSize: 'calc(0.8em + 0.2vw)',
                    '&.Mui-selected': {
                      color: 'black',
                      backgroundColor: 'white'
                    },
                  },
                  width: '100%'
                }}>
                <Tab className='details' label="Details" {...a11yProps(0)} disableRipple />
                <Tab className='specifications' label="Specifications" {...a11yProps(1)} disableRipple />
                <Tab className='reviews' label="Reviews" {...a11yProps(2)} disableRipple />
              </Tabs>
            </Box>

            {/* Details Tab */}
            <CustomTabPanel value={value} index={0}>
              <Box>
                <span style={{ fontSize: 'calc(1em + 0.2vw)', fontWeight: 'bold' }}>
                  Description
                </span>
                <p className='detailsText'>
                  {listing.description ||
                    `Prime advertising space in ${listing.city || 'NYC'}. This ${listing.type?.toLowerCase()} space offers excellent visibility and high foot traffic, perfect for impactful advertising campaigns. Contact the owner for more details about availability and booking.`
                  }
                </p>
              </Box>

              <Box>
                <Box style={{ fontSize: 'calc(1em + 0.2vw)', fontWeight: 'bold', marginTop: '1em' }}>
                  Features
                </Box>

                <Box sx={{ display: 'flex', width: '100%',flexWrap:'wrap' }}>
                  <Box>
                    {featuresCol1.map((feature, index) => (
                      <ListItem key={index}>
                        <ListItemIcon sx={{ minWidth: '2em !important' }}>
                          <ArrowForwardIosIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={feature}
                          sx={{
                            '& .MuiTypography-root': {
                              margin: 0,
                              color: 'black',
                              fontSize: 'calc(0.8em + 0.2vw)',
                              lineHeight: 1.2,
                              fontWeight: 600
                            },
                          }} />
                      </ListItem>
                    ))}
                  </Box>

                  <Box>
                    {featuresCol2.map((feature, index) => (
                      <ListItem key={index}>
                        <ListItemIcon sx={{ minWidth: '2em !important' }}>
                          <ArrowForwardIosIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={feature}
                          sx={{
                            '& .MuiTypography-root': {
                              margin: 0,
                              color: 'black',
                              fontSize: 'calc(0.8em + 0.2vw)',
                              lineHeight: 1.2,
                              fontWeight: 600
                            },
                          }} />
                      </ListItem>
                    ))}
                  </Box>
                </Box>
              </Box>

              <Box>
                <Box style={{ fontSize: 'calc(1em + 0.2vw)', fontWeight: 'bold', marginTop: '1em' }}>
                  Location
                </Box>
                <Box sx={{
                  width: '100%', height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center',
                  backgroundColor: '#f5f5f5', borderRadius: 2, marginTop: '0.5em'
                }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <BrokenImageIcon sx={{ fontSize: 48, color: '#ccc' }} />
                    <Typography sx={{ color: '#666', mt: 1 }}>
                      Map view coming soon
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CustomTabPanel>

            {/* Specifications Tab */}
            <CustomTabPanel value={value} index={1}>
              <span style={{ fontSize: 'calc(1em + 0.2vw)', fontWeight: 'bold' }}>
                Technical Specifications
              </span>

              <Box className='specificationDetails'>
                {specData.map((item, index) => (
                  <React.Fragment key={index}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <ListItemIcon sx={{
                        color: '#666', minWidth: 'auto', marginRight: '0.5em', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', width: '24px'
                      }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText primary={item.label}
                        sx={{
                          '& .MuiTypography-root': {
                            margin: 0, color: '#666', fontSize: 'calc(0.8em + 0.2vw)', fontWeight: 600,
                          },
                        }}
                      />
                    </Box>
                    <Box sx={{ fontSize: 'calc(0.8em + 0.2vw)', color: 'black', fontWeight: 600, margin: 0 }}>
                      {item.value}
                    </Box>
                  </React.Fragment>
                ))}
              </Box>

              {/* Documents Section */}
              <Box sx={{ marginTop: '1em' }}>
                <span style={{ fontSize: 'calc(1em + 0.2vw)', fontWeight: 'bold' }}>
                  Documents
                </span>
                <Box sx={{ marginTop: '0.5em' }}>
                  {listing.document_urls && listing.document_urls.length > 0 ? (
                    listing.document_urls.map((docUrl, index) => (
                      <Box key={index} className="mb-3 upload">
                        <a href={docUrl} target="_blank" rel="noopener noreferrer" className="btn">
                          <i className="bi bi-download"></i>
                          <span style={{ marginLeft: '0.3em', fontSize: 'calc(0.8em + 0.2vw)', color: 'black', fontWeight: 500 }}>
                            Document {index + 1} (PDF)
                          </span>
                        </a>
                      </Box>
                    ))
                  ) : (
                    <>
                      <Box className="mb-3 upload">
                        <label className="btn">
                          <i className="bi bi-download"></i>
                          <span style={{ marginLeft: '0.3em', fontSize: 'calc(0.8em + 0.2vw)', color: 'black', fontWeight: 500 }}>
                            Technical Specifications (Contact owner)
                          </span>
                        </label>
                      </Box>
                      <Box className="mb-3 upload">
                        <label className="btn">
                          <i className="bi bi-download"></i>
                          <span style={{ marginLeft: '0.3em', fontSize: 'calc(0.8em + 0.2vw)', color: 'black', fontWeight: 500 }}>
                            Traffic Analysis Report (Contact owner)
                          </span>
                        </label>
                      </Box>
                    </>
                  )}
                </Box>
              </Box>
            </CustomTabPanel>

            {/* Reviews Tab */}
            <CustomTabPanel value={value} index={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.3em' }}>
                <Box sx={{ fontSize: 'calc(1.5em + 0.2vw)', fontWeight: 'bold' }}>
                  {listing.average_rating || value1}
                </Box>
                <Rating name="read-only" value={listing.average_rating || value1} readOnly />
                <Box>({reviews.length} reviews)</Box>
              </Box>

              {reviews.map((review, index) => (
                <Box key={index}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '3em' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5em' }}>
                      <IconButton sx={{ p: 0 }}>
                        <Avatar alt={review.name} src="/static/images/avatar/2.jpg" sx={{ width: 56, height: 56 }} />
                      </IconButton>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ fontSize: 'calc(1em + 0.2vw)', fontWeight: 500, color: 'black' }}>{review.name}</Box>
                        <Box sx={{ fontSize: 'calc(0.8em + 0.2vw)', fontWeight: 500, color: '#666' }}>{review.company}</Box>
                      </Box>
                    </Box>
                    <Box sx={{ fontSize: 'calc(0.8em + 0.2vw)', marginTop: '0.3em' }}>
                      {review.date}
                    </Box>
                  </Box>

                  <Box sx={{ marginTop: '1em' }}>
                    <Rating name="read-only" value={review.rating} readOnly />
                  </Box>

                  <Box sx={{ fontSize: 'calc(0.8em + 0.2vw)', marginTop: '0.3em' }}>
                    {review.comment}
                  </Box>

                  {index < reviews.length - 1 && <Divider sx={{ my: 2, backgroundColor: 'black' }} />}
                </Box>
              ))}
            </CustomTabPanel>
          </Box>

          {/* Sidebar with wrapper for responsive grid */}
          <Box className='sidebaar'>

            <div className="sidebar-content">

              <Box className='detailsLeftSideBar1'>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>

                  <Box sx={{ fontSize: 'calc(1em + 0.2vw)', fontWeight: 'bold' }}>
                    {formatPrice(listing.price_per_week || (listing.price_per_day ? listing.price_per_day * 7 : undefined))}
                  </Box>
                  <span style={{ color: '#666', fontWeight: 500 }}>/week</span>
                </Box>


                <Box sx={{ fontSize: 'calc(0.8em + 0.2vw)', color: '#666', fontWeight: 500 }}>
                  {formatAvailability(listing.available_from)}
                </Box>

                {/* Date Pickers */}
                <Box sx={{ display: 'flex', gap: '1em', marginTop: '2em', flexWrap: 'wrap' }}>
                  <Box sx={{ width: '100%' }}>
                    <Typography sx={{ fontSize: 'calc(0.9rem + 0.1vw)' }}>Start Date</Typography>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        value={startDate}
                        onChange={(newValue) => setstartDate(newValue)}
                        slots={{ openPickerIcon: CalendarToday }}
                        slotProps={{
                          textField: {
                            size: 'small',
                            sx: {
                              width: '100%',
                              minWidth: 'unset',
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '4px',
                                '& fieldset': { borderColor: '#d3d2d2' },
                              },
                              '& .MuiInputBase-input': { py: 0.5, height: 'auto' },
                            },
                          },
                          popper: { sx: { zIndex: 9999 } }
                        }}
                      />
                    </LocalizationProvider>
                  </Box>

                  <Box sx={{ width: '100%' }}>
                    <Typography sx={{ fontSize: 'calc(0.9rem + 0.1vw)' }}>End Date</Typography>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        value={endDate}
                        onChange={(newValue) => setendDate(newValue)}
                        slots={{ openPickerIcon: CalendarToday }}
                        slotProps={{
                          textField: {
                            size: 'small',
                            sx: {
                              width: '100%',
                              minWidth: 'unset',
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '4px',
                                '& fieldset': { borderColor: '#d3d2d2' },
                              },
                              '& .MuiInputBase-input': { py: 0.5, height: 'auto' },
                            },
                          },
                          popper: { sx: { zIndex: 9999 } }
                        }}
                      />
                    </LocalizationProvider>
                  </Box>
                </Box>

                {/* Duration and Pricing */}
                <Typography sx={{ fontSize: 'calc(0.9rem + 0.1vw)', marginTop: '1em' }}>Duration</Typography>
                <Box sx={{ display: 'flex', width: '100%', border: '2px solid rgb(211, 210, 210)', borderRadius: '0.3em', padding: '0.5em', gap: '1em' }}>
                  <i className="bi bi-clock-fill"></i>
                  <Box sx={{ fontWeight: 600, fontSize: 'calc(1rem + 0.1vw)' }}>2 weeks</Box>
                </Box>

                {/* Price Breakdown */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', marginTop: '1em' }}>
                  <Box sx={{ color: '#666', fontWeight: 500, fontSize: 'calc(0.9rem + 0.1vw)' }}>
                    {formatPrice(listing.price_per_week)} x 2 weeks
                  </Box>
                  <Box sx={{ fontWeight: 600, fontSize: 'calc(0.9rem + 0.1vw)' }}>
                    {formatPrice(listing.price_per_week ? listing.price_per_week * 2 : undefined)}
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', marginTop: '1em' }}>
                  <Box sx={{ color: '#666', fontWeight: 500, fontSize: 'calc(0.9rem + 0.1vw)' }}>Installation fee</Box>
                  <Box sx={{ fontWeight: 600, fontSize: 'calc(0.9rem + 0.1vw)' }}>$1,700</Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', marginTop: '1em' }}>
                  <Box sx={{ color: '#666', fontWeight: 500, fontSize: 'calc(0.9rem + 0.1vw)' }}>Service fee</Box>
                  <Box sx={{ fontWeight: 600, fontSize: 'calc(0.9rem + 0.1vw)' }}>$1,000</Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', marginTop: '1em' }}>
                  <Box sx={{ color: 'black', fontWeight: 500, fontSize: 'calc(0.9rem + 0.1vw)' }}>Total</Box>
                  <Box sx={{ fontWeight: 600, fontSize: 'calc(0.9rem + 0.1vw)' }}>
                    {formatPrice(listing.price_per_week ? listing.price_per_week * 2 + 1700 + 1000 : undefined)}
                  </Box>
                </Box>

                <button 
                  className='DetailsButton'
                  onClick={() => setContactModalOpen(true)}
                >
                  Contact Owner
                </button>

                <Box sx={{ textAlign: 'center', marginTop: '1em', color: '#666', fontWeight: 600, fontSize: 'calc(0.9rem + 0.1vw)' }}>
                  You won't be charged yet
                </Box>

                <Box className='reportItem'>
                  <i className="bi bi-flag" />
                  <Link to="/" style={{ borderBottom: '2px solid #666', color: '#666', fontWeight: 600, fontSize: 'calc(0.9rem + 0.1vw)' }}>
                    Report this Listing
                  </Link>
                </Box>
              </Box>


              <Box className = 'tabletscreenView'>
                {/* Owner Info */}
                <Box className='detailsLeftSideBar2'>
                  <Box sx={{ fontSize: 'calc(1em + 0.2vw)', fontWeight: 'bold' }}>About the Owner</Box>

                  <Box sx={{ fontSize: 'calc(0.8em + 0.2vw)', fontWeight: 500, textAlign: 'center', marginTop: '1em' }}>
                    {listing.landlord_name || 'Property Owner'}
                  </Box>

                  <Box sx={{ color: '#666', fontWeight: 500, fontSize: 'calc(0.8rem + 0.1vw)', textAlign: 'center' }}>
                    {listing.landlord_verified ? '✓ Verified Owner' : 'Member since 2023'}
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', marginTop: '1em' }}>
                    <Box sx={{ color: '#666', fontWeight: 500, fontSize: 'calc(0.9rem + 0.1vw)' }}>Response Rate</Box>
                    <Box sx={{ fontWeight: 600, fontSize: 'calc(0.9rem + 0.1vw)' }}>95%</Box>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', marginTop: '1em' }}>
                    <Box sx={{ color: '#666', fontWeight: 500, fontSize: 'calc(0.9rem + 0.1vw)' }}>Active Listings</Box>
                    <Box sx={{ fontWeight: 600, fontSize: 'calc(0.9rem + 0.1vw)' }}>3</Box>
                  </Box>
                </Box>

                {/* Similar Spaces */}
                <Box className='detailsLeftSideBar3'>
                  <Box sx={{ fontSize: 'calc(1em + 0.2vw)', fontWeight: 'bold' }}>Similar Spaces</Box>

                  <Box sx={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                    <p>Similar spaces will be shown here</p>
                  </Box>

                  <button className='spacesviewButton'>View Similar Spaces</button>
                </Box>
              </Box>
            </div>
          </Box>
        </Box>
      </div>
      {/* Add this before the final closing </Box> tag */}
        <ContactOwnerModal 
          open={contactModalOpen}
          onClose={() => setContactModalOpen(false)}
          listingId={listing.id}
          listingTitle={listing.title}
        />
    </Box>
  );
} //