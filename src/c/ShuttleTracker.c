#include <pebble.h>

static Window *s_main_window;
static TextLayer *s_shuttle_layer;
static TextLayer *s_route_layer;
static TextLayer *s_stop_layer;
static GFont s_font;

static void main_window_load(Window *window) {
	Layer *window_layer = window_get_root_layer(window);
	GRect bounds = layer_get_bounds(window_layer);
	
	s_shuttle_layer = text_layer_create(GRect(0, PBL_IF_ROUND_ELSE(136, 131), bounds.size.w, 18));
	s_stop_layer = text_layer_create(GRect(0, PBL_IF_ROUND_ELSE(100, 95), bounds.size.w, 36));
	s_route_layer = text_layer_create(GRect(0, PBL_IF_ROUND_ELSE(64, 59), bounds.size.w, 36));
	
	text_layer_set_background_color(s_shuttle_layer, GColorClear);
	text_layer_set_text_color(s_shuttle_layer, GColorBlack);
	text_layer_set_text_alignment(s_shuttle_layer, GTextAlignmentLeft);
	text_layer_set_text(s_shuttle_layer, "Loading.... ");

	text_layer_set_background_color(s_route_layer, GColorClear);
	text_layer_set_text_color(s_route_layer, GColorBlack);
	text_layer_set_text_alignment(s_route_layer, GTextAlignmentLeft);

	text_layer_set_background_color(s_stop_layer, GColorClear);
	text_layer_set_text_color(s_stop_layer, GColorBlack);
	text_layer_set_text_alignment(s_stop_layer, GTextAlignmentLeft);

	s_font = fonts_load_custom_font(resource_get_handle(RESOURCE_ID_FONT_PERFECT_DOS_15));
	text_layer_set_font(s_shuttle_layer, s_font);
	text_layer_set_font(s_route_layer, s_font);
	text_layer_set_font(s_stop_layer, s_font);

	layer_add_child(window_get_root_layer(window), text_layer_get_layer(s_route_layer));
	layer_add_child(window_get_root_layer(window), text_layer_get_layer(s_shuttle_layer));
	layer_add_child(window_get_root_layer(window), text_layer_get_layer(s_stop_layer));
}

static void main_window_unload(Window *window) {
	text_layer_destroy(s_shuttle_layer);
	fonts_unload_custom_font(s_font);
	text_layer_destroy(s_route_layer);
	text_layer_destroy(s_stop_layer);
}

static void inbox_received_callback(DictionaryIterator *iterator, void *context) {
	static char arrival_buffer[32];
	static char shuttle_layer_buffer[32];
	static char route_buffer[32];
	static char route_layer_buffer[32];
	static char stop_buffer[32];
	static char stop_layer_buffer[32];

	Tuple *arrival_tuple = dict_find(iterator, MESSAGE_KEY_ARRIVALTIME);
	Tuple *route_tuple = dict_find(iterator, MESSAGE_KEY_ROUTENAME);
	Tuple *stop_tuple = dict_find(iterator, MESSAGE_KEY_STOPNAME);

	if (stop_tuple) {
		snprintf(stop_buffer, sizeof(stop_buffer), "Stop: %s", stop_tuple->value->cstring);
	}

	if (route_tuple) {
		snprintf(route_buffer, sizeof(route_buffer), "Route: %s", route_tuple->value->cstring);
	}

	if (arrival_tuple) {
		if ((int)arrival_tuple->value->int32 == -1) {
			snprintf(arrival_buffer, sizeof(arrival_buffer), "Est. time: No Info");
		} else {
			snprintf(arrival_buffer, sizeof(arrival_buffer), "Est. time: %d mins", (int)arrival_tuple->value->int32);
		}
	}

	snprintf(stop_layer_buffer, sizeof(stop_layer_buffer), "%s", stop_buffer);
	snprintf(route_layer_buffer, sizeof(route_layer_buffer), "%s", route_buffer);
	snprintf(shuttle_layer_buffer, sizeof(shuttle_layer_buffer), "%s", arrival_buffer);
	text_layer_set_text(s_shuttle_layer, shuttle_layer_buffer);
	text_layer_set_text(s_route_layer, route_layer_buffer);
	text_layer_set_text(s_stop_layer, stop_layer_buffer);
}

static void inbox_dropped_callback(AppMessageResult reason, void *context) {
  APP_LOG(APP_LOG_LEVEL_ERROR, "Message droppped!");
}

static void outbox_failed_callback(DictionaryIterator *iterator, AppMessageResult reason, void *context){
  APP_LOG(APP_LOG_LEVEL_ERROR, "Outbox sent failed!");
}

static void outbox_sent_callback(DictionaryIterator *iterator, void *context) {
  APP_LOG(APP_LOG_LEVEL_INFO, "Outbox sent success!");
}

static void init() {
	s_main_window = window_create();

	window_set_window_handlers(s_main_window, (WindowHandlers) {
		.load = main_window_load,
		.unload = main_window_unload
	});

	window_stack_push(s_main_window, true);

	app_message_register_inbox_received(inbox_received_callback);
	app_message_register_inbox_dropped(inbox_dropped_callback);
	app_message_register_outbox_failed(outbox_failed_callback);
	app_message_register_outbox_sent(outbox_sent_callback);

	const int inbox_size = 128;
	const int outbox_size = 128;
	app_message_open(inbox_size, outbox_size);
}

static void deinit() {
	window_destroy(s_main_window);
}

int main(void) {
  init();
  app_event_loop();
  deinit();
}
