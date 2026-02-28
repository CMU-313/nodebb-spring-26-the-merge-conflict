<!-- IMPORT partials/account/header.tpl -->

<h3 class="fw-semibold fs-5">[[pages:account/follow-requests, {username}]]</h3>

{{{ if !users.length }}}
<div class="alert alert-info text-center">[[user:no-incoming-follow-requests]]</div>
{{{ end }}}

<div component="account/follow-requests/list" class="d-flex flex-column gap-2">
	{{{ each users }}}
	<div class="d-flex align-items-center gap-2 p-2 rounded-1 text-bg-light" data-uid="{./uid}">
		{buildAvatar(@value, "32px", true, "flex-shrink-0")}
		<a href="{config.relative_path}/user/{./userslug}" class="text-truncate">{./displayname}</a>
		<div class="ms-auto d-flex gap-1 flex-shrink-0">
			<button component="account/follow-requests/accept" data-requester-uid="{./uid}" class="btn btn-sm btn-primary">[[user:accept]]</button>
			<button component="account/follow-requests/reject" data-requester-uid="{./uid}" class="btn btn-sm btn-outline-danger">[[user:reject]]</button>
		</div>
	</div>
	{{{ end }}}
</div>

<!-- IMPORT partials/paginator.tpl -->
<!-- IMPORT partials/account/footer.tpl -->
