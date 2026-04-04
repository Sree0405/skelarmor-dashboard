import { useEffect, useState } from "react";
import type { Customer } from "./types";
import { readCustomerWeight, readCustomerFatPct } from "./types";

export function useCustomerDetailFormState(customer: Customer | null | undefined) {
  const [edit, setEdit] = useState({
    first_name: "",
    last_name: "",
    email: "",
    status: "active",
    age: "",
    goal: "",
    currentWeight: "",
    fatPercentage: "",
    subscription: "",
  });

  const [paymentForm, setPaymentForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    amount: "",
    type: "paid",
    notes: "",
  });

  useEffect(() => {
    if (!customer) return;
    const w = readCustomerWeight(customer);
    const f = readCustomerFatPct(customer);
    setEdit({
      first_name: customer.first_name ?? "",
      last_name: customer.last_name ?? "",
      email: customer.email ?? "",
      status: (customer.status as string) || "active",
      age: customer.age != null ? String(customer.age) : "",
      goal: typeof customer.goal === "string" ? customer.goal : "",
      currentWeight: w != null ? String(w) : "",
      fatPercentage: f != null ? String(f) : "",
      subscription: typeof customer.subscription === "string" ? customer.subscription : "",
    });
  }, [customer]);

  return {
    edit,
    setEdit,
    paymentForm,
    setPaymentForm,
  };
}
