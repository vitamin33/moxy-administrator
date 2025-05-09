import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher, Link, Outlet } from "@remix-run/react";
import { authenticate, getOrders } from "../shopify.server";
import { Page, Card, Button, Text, IndexTable, useIndexResourceState, Badge } from "@shopify/polaris";
import { format } from "date-fns";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  console.log("Session says shop domain is:", session?.shop);

  const orders = await getOrders(admin);

  console.log("SSR orders:", orders);

  return { orders };
};

export const action = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const method = request.method;
  const data = await request.formData();
  const orders = JSON.parse(data.get("orders") as string);

  switch (method) {
    case "POST":
      for (const id of orders) {
        const response = await admin.graphql(
          `mutation orderMarkAsPaid($orderId: ID!) {
            orderMarkAsPaid(orderId: $orderId) {
              order { id }
              userErrors {
                field
                message
              }
            }
          }`,
          {
            variables: {
              "orderId": id
            },
          }
        );

        console.log("Selected orders marked as paid response:", response);
      }
      break;

    case "DELETE":
      for (const id of orders) {
        const response = await admin.graphql(
          `mutation OrderDelete($orderId: ID!) {
            orderDelete(orderId: $orderId) {
              deletedId
              userErrors {
                field
                message
                code
              }
            }
          }`,
          {
            variables: {
              "orderId": id
            },
          },
        );

        console.log("Delete order response:", response);
      }
      break;

    default:
      console.warn("Unsupported method:", method);
      return new Response("Method not allowed", { status: 405 });
  }

  return new Response(JSON.stringify({ status: "Success" }), { status: 200 });
}

export default function OrdersPage() {
  const { orders } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  //console.log("Client orders:", orders);

  const resourceName = {
    singular: 'order',
    plural: 'orders'
  };

  const {selectedResources, allResourcesSelected, handleSelectionChange} =
    useIndexResourceState(orders);

  const rowMarkup = orders.map(
    (order: {
      id: string;
      name: string;
      customer?: { firstName: string; lastName: string };
      totalPriceSet: {
        presentmentMoney: { amount: string; currencyCode: string };
      };
      createdAt: string;
      fullyPaid: boolean;
      index: number
    }) => {
      const formatted = format(new Date(order.createdAt), 'MMM d, yyyy, HH:mm');

      return (
      <IndexTable.Row
        id={order.id}
        key={order.id}
        selected={selectedResources.includes(order.id)}
        position={order.index}
      >
        <IndexTable.Cell>{order.name}</IndexTable.Cell>
        <IndexTable.Cell>{order.customer?.firstName || "Guest"} {order.customer?.lastName}</IndexTable.Cell> 
        <IndexTable.Cell>
          <Text as="p" alignment="end">
            {order.totalPriceSet.presentmentMoney.amount} {order.totalPriceSet.presentmentMoney.currencyCode}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Badge 
            progress={order.fullyPaid? "complete" : "incomplete"} 
            tone={order.fullyPaid? "new" : "warning"}
          >
            {order.fullyPaid? "Paid" : "Pending"}
          </Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>{ formatted }</IndexTable.Cell>
        <IndexTable.Cell>City</IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="p" alignment="end">4</Text>
        </IndexTable.Cell>
      </IndexTable.Row>
    )}
  );
  
    const promotedBulkActions = [
      {
        content: 'Mark As Paid',
        onAction: () => {
          fetcher.submit(
            { orders: JSON.stringify(selectedResources) },
            { method: "post", action: "/app/orders" }
          );
        }
      },
      {
        content: 'Delete',
        destructive: true,
        onAction: () => {
          fetcher.submit(
            { orders: JSON.stringify(selectedResources) },
            { method: "delete", action: "/app/orders" }
          );
        }
      }
    ];

    return (
      <Page
        title="Orders"
        primaryAction={
          <Link to="/app/orders/create">
            <Button variant="primary">Create Order</Button>
          </Link>        
        }
      >
      <Card>
        <IndexTable
            resourceName={resourceName}
            itemCount={orders.length}
            selectedItemsCount={
              allResourcesSelected ? 'All' : selectedResources.length
            }
            onSelectionChange={handleSelectionChange}
            headings={[
              {title: 'Order'},
              {title: 'Customer'},
              {title: 'Total', alignment: 'end'},
              {title: 'Payment status'},
              {title: 'Date'},
              {title: 'City'},
              {title: 'Nova Poshta number', alignment: 'end'}
            ]}
            promotedBulkActions={promotedBulkActions}
          >
            {rowMarkup}
          </IndexTable>
        </Card>
      </Page>
    );
}
