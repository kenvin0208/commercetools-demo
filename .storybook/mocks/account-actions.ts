import type { ActionState } from "@/src/lib/account/validation";

export async function addToWishlistAction(
  state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  void state;
  void formData;
  return { success: "Saved to your wishlist in this Storybook preview." };
}
