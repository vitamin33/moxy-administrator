import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher, Link } from "@remix-run/react";
import { authenticate, getOrders } from "../shopify.server";
import { Page, Card, Button, Text, IndexTable, useIndexResourceState, Badge } from "@shopify/polaris";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  console.log("Session says shop domain is:", session?.shop);

  const orders = await getOrders(admin);

  console.log("SSR orders:", orders);

  return { orders };
};

export const action = async ({ request }: LoaderFunctionArgs) => {
  const { authenticate } = await import("../shopify.server");
  const { admin } = await authenticate.admin(request);
  const method = request.method;
  const data = await request.formData();
  const orders = JSON.parse(data.get("orders") as string);

  console.log(method);

  if(method == "post") {
  for (const id of orders) {
    const response = await admin.graphql(
      `mutation orderMarkAsPaid($input: OrderMarkAsPaidInput!) {
        orderMarkAsPaid(input: $input) {
          order {
            id
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          input: {
            id,
          },
        },
      }
    );
  }
  }
  

  return new Response(JSON.stringify({ status: "done" }), {
    status: 200,
  });
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
      shippingAddress?: {
        city: string;
      };
      index: number
    }) => (
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
        <IndexTable.Cell>{order.createdAt}</IndexTable.Cell>
        <IndexTable.Cell>{order.shippingAddress?.city}</IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="p" alignment="end">4</Text>
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
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
