import { useState } from "react";
import { useFetcher } from "@remix-run/react";
import {
  Page,
  Card,
  Form,
  FormLayout,
  TextField,
  Select,
  Button,
} from "@shopify/polaris";

export default function CreateOrderPage() {
  const fetcher = useFetcher();
  const [customerName, setCustomerName] = useState("");
  const [product, setProduct] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [size, setSize] = useState("");
  const [postOffice, setPostOffice] = useState("");
  const [recipient, setRecipient] = useState("");

  const products = [
    { label: "Select a product", value: "" },
    { label: "Product 1", value: "123456" }, // Replace with actual product IDs
    { label: "Product 2", value: "789012" },
  ];

  const sizes = [
    { label: "Select size", value: "" },
    { label: "Small", value: "small" },
    { label: "Medium", value: "medium" },
    { label: "Large", value: "large" },
  ];

  const handleSubmit = () => {
    fetcher.submit(
      {
        customerName,
        product,
        quantity,
        size,
        postOffice,
        recipient,
      },
      { method: "post", action: "/app/orders/create" },
    );
  };

  return (
    <Page title="Create Order">
      <Card>
        <Form onSubmit={handleSubmit}>
          <FormLayout>
            <TextField
              label="Customer Name"
              value={customerName}
              onChange={setCustomerName}
              autoComplete="off" // Add this property
            />
            <Select
              label="Product"
              options={products}
              onChange={setProduct}
              value={product}
            />
            <TextField
              label="Quantity"
              value={quantity}
              onChange={setQuantity}
              type="number"
              autoComplete="off" // Add this property
            />
            <Select
              label="Size"
              options={sizes}
              onChange={setSize}
              value={size}
            />
            <TextField
              label="Novoposhta Post Office"
              value={postOffice}
              onChange={setPostOffice}
              autoComplete="off" // Add this property
            />
            <TextField
              label="Recipient Name"
              value={recipient}
              onChange={setRecipient}
              autoComplete="off" // Add this property
            />
            <Button submit variant="primary">
              Create Order
            </Button>
          </FormLayout>
        </Form>
      </Card>
    </Page>
  );
}
