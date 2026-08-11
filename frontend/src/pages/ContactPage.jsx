import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import QuoteModal from '../components/QuoteModal';

const ContactPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productName = searchParams.get('product') || 'General Inquiry';
  return <QuoteModal isOpen selectedProduct={{ name: productName }} onClose={() => navigate(-1)} />;
};

export default ContactPage;
